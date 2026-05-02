'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { uniqueSlug } = require('../utils/slugify');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const logger = require('../logger');

const router = express.Router();

router.post('/signup', authLimiter, [
  body('email').isEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('username').matches(/^[a-zA-Z0-9_]{3,20}$/).withMessage('Username must be 3-20 alphanumeric characters or underscores.'),
  body('display_name').trim().isLength({ min: 1, max: 50 }).withMessage('Display name must be 1-50 characters.'),
], handleValidation, async (req, res) => {
  try {
    const { email, password, username, display_name, sport, location } = req.body;
    const emailCheck = await pool.query('SELECT 1 FROM creator_accounts WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) return res.status(409).json({ error: 'Email already registered.' });
    const usernameCheck = await pool.query('SELECT 1 FROM creators WHERE username = $1', [username.toLowerCase()]);
    if (usernameCheck.rows.length > 0) return res.status(409).json({ error: 'Username already taken.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const slug = await uniqueSlug(username, 'creators');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const creatorRes = await client.query(
        'INSERT INTO creators (username, slug, display_name, sport, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username.toLowerCase(), slug, display_name, sport || null, location || null]
      );
      const creator = creatorRes.rows[0];
      const accountRes = await client.query(
        'INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [creator.id, email.toLowerCase(), passwordHash]
      );
      await client.query('COMMIT');
      const token = signToken({ sub: accountRes.rows[0].id, type: 'creator' });
      return res.status(201).json({
        token,
        user: { id: creator.id, username: creator.username, slug: creator.slug, display_name: creator.display_name, sport: creator.sport, avatar_url: creator.avatar_url },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('POST /api/auth/signup', { message: err.message });
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', authLimiter, [
  body('email').notEmpty().withMessage('Email required.'),
  body('password').notEmpty().withMessage('Password required.'),
], handleValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      `SELECT ca.*, c.id AS creator_id, c.username, c.slug, c.display_name, c.avatar_url, c.sport
       FROM creator_accounts ca JOIN creators c ON c.id = ca.creator_id
       WHERE ca.email = $1`,
      [email.toLowerCase()]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials.' });
    const account = rows[0];
    if (account.is_suspended) return res.status(403).json({ error: 'Account suspended.' });
    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    await pool.query('UPDATE creator_accounts SET last_login = NOW() WHERE id = $1', [account.id]);
    const token = signToken({ sub: account.id, type: 'creator' });
    return res.json({
      token,
      user: { id: account.creator_id, username: account.username, slug: account.slug, display_name: account.display_name, sport: account.sport, avatar_url: account.avatar_url, email: account.email },
    });
  } catch (err) {
    logger.error('POST /api/auth/login', { message: err.message });
    return res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
  return res.json({ user: req.user });
});

module.exports = router;
