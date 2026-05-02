'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { getPool } = require('../db/client');
const { signToken } = require('../utils/jwt');
const { uniqueSlug } = require('../utils/slugify');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const auditLogger = require('../utils/auditLogger');

const router = express.Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('username')
      .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('display_name').isLength({ min: 1, max: 50 }).withMessage('Display name must be 1-50 characters'),
  ],
  validate,
  async (req, res) => {
    const pool = getPool();
    const { email, password, username, display_name, sport, location } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query(
        `SELECT id FROM creator_accounts WHERE email = $1`,
        [email]
      );
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Email already registered' });
      }

      const userCheck = await client.query(
        `SELECT id FROM creators WHERE username = $1`,
        [username]
      );
      if (userCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Username already taken' });
      }

      const slug = await uniqueSlug(username, 'creators');
      const passwordHash = await bcrypt.hash(password, 12);

      const creatorRes = await client.query(
        `INSERT INTO creators (username, slug, display_name, sport, location) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [username, slug, display_name, sport || null, location || null]
      );
      const creator = creatorRes.rows[0];

      const accountRes = await client.query(
        `INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
        [creator.id, email, passwordHash]
      );
      const account = accountRes.rows[0];

      await client.query('COMMIT');

      const token = signToken({ sub: account.id, type: 'creator' });
      auditLogger.log({ actor_type: 'creator', actor_id: account.id, action: 'CREATOR_SIGNUP', ip_address: req.ip });

      return res.status(201).json({
        token,
        user: {
          id: creator.id,
          username: creator.username,
          slug: creator.slug,
          display_name: creator.display_name,
          sport: creator.sport,
          avatar_url: creator.avatar_url,
          email,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    const pool = getPool();
    const { email, password } = req.body;
    try {
      const { rows } = await pool.query(
        `SELECT ca.*, c.id AS creator_id, c.username, c.slug, c.display_name, c.sport, c.avatar_url, c.location
         FROM creator_accounts ca
         JOIN creators c ON c.id = ca.creator_id
         WHERE ca.email = $1`,
        [email]
      );
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const account = rows[0];
      if (account.is_suspended) {
        return res.status(403).json({ error: 'Account is suspended. Contact support.' });
      }
      const valid = await bcrypt.compare(password, account.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      await pool.query(`UPDATE creator_accounts SET last_login = NOW() WHERE id = $1`, [account.id]);
      const token = signToken({ sub: account.id, type: 'creator' });
      auditLogger.log({ actor_type: 'creator', actor_id: account.id, action: 'CREATOR_LOGIN', ip_address: req.ip });
      return res.json({
        token,
        user: {
          id: account.creator_id,
          username: account.username,
          slug: account.slug,
          display_name: account.display_name,
          sport: account.sport,
          avatar_url: account.avatar_url,
          email: account.email,
        },
      });
    } catch (err) {
      throw err;
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') {
    return res.status(403).json({ error: 'Creator auth required' });
  }
  return res.json({ user: req.user });
});

module.exports = router;
