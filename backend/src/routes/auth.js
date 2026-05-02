'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { slugify, ensureUniqueSlug } = require('../utils/slugify');
const { validationErrorHandler } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const audit = require('../utils/auditLogger');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a digit'),
    body('username')
      .matches(/^[a-zA-Z0-9_]{3,20}$/).withMessage('Username must be 3–20 alphanumeric characters or underscores'),
    body('display_name').trim().isLength({ min: 1, max: 50 }).withMessage('Display name is required (max 50 chars)'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { email, password, username, display_name, sport = '', location = '' } = req.body;
      const existingUsername = db.prepare('SELECT id FROM creators WHERE username = ?').get(username);
      if (existingUsername) return res.status(409).json({ success: false, error: 'Username already taken.' });
      const existingEmail = db.prepare('SELECT id FROM creator_accounts WHERE email = ?').get(email);
      if (existingEmail) return res.status(409).json({ success: false, error: 'Email already registered.' });

      const hash = bcrypt.hashSync(password, 12);
      let slug = slugify(username);
      slug = ensureUniqueSlug(db, 'creators', slug);

      const creator = db.prepare(
        'INSERT INTO creators (username, slug, display_name, sport, location) VALUES (?, ?, ?, ?, ?)'
      ).run(username, slug, display_name, sport, location);

      const account = db.prepare(
        'INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)'
      ).run(creator.lastInsertRowid, email, hash);

      const token = signToken({ sub: account.lastInsertRowid, type: 'creator' });
      audit.log({ actor_type: 'creator', actor_id: account.lastInsertRowid, action: 'CREATOR_SIGNUP', ip_address: req.ip });

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: { id: creator.lastInsertRowid, username, slug, display_name, sport, avatar_url: '', email },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
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
  validationErrorHandler,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const account = db.prepare(
        `SELECT ca.*, c.id as creator_id, c.username, c.slug, c.display_name, c.bio, c.avatar_url, c.sport, c.location
         FROM creator_accounts ca
         JOIN creators c ON c.id = ca.creator_id
         WHERE ca.email = ?`
      ).get(email);

      if (!account) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
      if (account.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended.' });

      const valid = bcrypt.compareSync(password, account.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials.' });

      db.prepare('UPDATE creator_accounts SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(account.id);
      const token = signToken({ sub: account.id, type: 'creator' });

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: account.creator_id, username: account.username, slug: account.slug,
            display_name: account.display_name, bio: account.bio,
            avatar_url: account.avatar_url, sport: account.sport,
            location: account.location, email: account.email,
          },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get('/me', requireAuth, (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access only.' });
  const { password_hash, ...safe } = req.user;
  return res.json({ success: true, data: safe });
});

module.exports = router;
