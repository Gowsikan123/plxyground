'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { uniqueSlug } = require('../utils/slugify');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const auditLogger = require('../utils/auditLogger');

const router = express.Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required.'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain a number.'),
    body('username')
      .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters.')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, underscores.'),
    body('display_name').isLength({ min: 1, max: 50 }).withMessage('Display name required (max 50 chars).'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, username, display_name, sport, location } = req.body;
      const hash = await bcrypt.hash(password, 12);
      const slug = await uniqueSlug(username, 'creators', 'slug');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const cRes = await client.query(
          `INSERT INTO creators (username, slug, display_name, sport, location)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [username, slug, display_name, sport || null, location || null]
        );
        const creatorId = cRes.rows[0].id;
        const acRes = await client.query(
          `INSERT INTO creator_accounts (creator_id, email, password_hash)
           VALUES ($1, $2, $3) RETURNING id`,
          [creatorId, email, hash]
        );
        const accountId = acRes.rows[0].id;
        await client.query('COMMIT');

        const token = signToken({ sub: accountId, type: 'creator' });
        await auditLogger.log({ actor_type: 'creator', actor_id: accountId, action: 'CREATOR_SIGNUP', ip_address: req.ip });
        return res.status(201).json({
          token,
          user: { id: creatorId, username, slug, display_name, sport: sport || null, avatar_url: null },
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Email or username already taken.' });
      }
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').notEmpty().withMessage('Email required.'),
    body('password').notEmpty().withMessage('Password required.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const { rows } = await pool.query(
        `SELECT ca.id, ca.creator_id, ca.email, ca.password_hash, ca.is_suspended, ca.role,
                c.username, c.slug, c.display_name, c.sport, c.avatar_url
         FROM creator_accounts ca JOIN creators c ON c.id = ca.creator_id
         WHERE ca.email = $1`,
        [email]
      );
      const account = rows[0];
      if (!account) return res.status(401).json({ error: 'Invalid credentials.' });
      if (account.is_suspended) return res.status(403).json({ error: 'Account suspended.' });
      const valid = await bcrypt.compare(password, account.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
      await pool.query('UPDATE creator_accounts SET last_login = NOW() WHERE id = $1', [account.id]);
      const token = signToken({ sub: account.id, type: 'creator' });
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
      return res.status(500).json({ error: 'Server error.' });
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
    return res.json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
