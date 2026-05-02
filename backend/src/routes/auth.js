'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const slugify = require('../utils/slugify');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('username').isAlphanumeric('en-US', { ignore: '_' }).isLength({ min: 3, max: 30 }),
  body('display_name').trim().isLength({ min: 1, max: 60 }),
], validate, async (req, res) => {
  try {
    const { email, password, username, display_name, sport, location } = req.body;
    const slug = slugify(username);
    const hash = await bcrypt.hash(password, 12);

    const creatorResult = await db.prepare(
      `INSERT INTO creators (username, slug, display_name, sport, location) VALUES ($1, $2, $3, $4, $5) RETURNING id`
    ).run(username, slug, display_name, sport || null, location || null);

    const creatorId = creatorResult.lastInsertRowid;
    await db.prepare(
      `INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES ($1, $2, $3)`
    ).run(creatorId, email, hash);

    const token = signToken({ sub: creatorId, type: 'creator' });
    const creator = await db.prepare('SELECT * FROM creators WHERE id = $1').get(creatorId);
    return res.status(201).json({ success: true, data: { token, user: creator } });
  } catch (err) {
    if (err.code === '23505' || (err.message && (err.message.includes('UNIQUE') || err.message.includes('unique')))) {
      return res.status(409).json({ success: false, error: 'Email or username already taken' });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const account = await db.prepare('SELECT * FROM creator_accounts WHERE email = $1').get(email);
    if (!account) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (account.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended' });
    const match = await bcrypt.compare(password, account.password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    await db.prepare('UPDATE creator_accounts SET last_login = NOW() WHERE id = $1').run(account.id);
    const creator = await db.prepare('SELECT * FROM creators WHERE id = $1').get(account.creator_id);
    const token = signToken({ sub: account.creator_id, type: 'creator' });
    return res.json({ success: true, data: { token, user: creator } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
  const creator = await db.prepare('SELECT * FROM creators WHERE id = $1').get(req.user.sub);
  if (!creator) return res.status(404).json({ success: false, error: 'Not found' });
  return res.json({ success: true, data: creator });
});

module.exports = router;
