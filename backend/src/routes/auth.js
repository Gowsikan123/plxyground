'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { slugify, ensureUniqueSlug } = require('../utils/slugify');
const audit = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

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
      .matches(/^[a-zA-Z0-9_]{3,20}$/).withMessage('Username must be 3-20 characters, alphanumeric or underscore'),
    body('display_name')
      .isLength({ min: 1, max: 50 }).withMessage('Display name must be 1-50 characters'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const { email, password, username, display_name, sport = '', location = '' } = req.body;

      const existingUsername = db.prepare('SELECT id FROM creators WHERE username = ?').get(username);
      if (existingUsername) {
        return res.status(409).json({ success: false, error: 'Username already taken' });
      }

      const existingEmail = db.prepare('SELECT id FROM creator_accounts WHERE email = ?').get(email);
      if (existingEmail) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }

      const passwordHash = bcrypt.hashSync(password, 12);
      const baseSlug = slugify(username);
      const slug = ensureUniqueSlug('creators', baseSlug);

      const creator = db
        .prepare('INSERT INTO creators (username, slug, display_name, sport, location) VALUES (?, ?, ?, ?, ?)')
        .run(username, slug, display_name, sport, location);

      const account = db
        .prepare('INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)')
        .run(creator.lastInsertRowid, email, passwordHash);

      const token = signToken({ sub: account.lastInsertRowid, type: 'creator' });

      audit.log({
        actor_type: 'creator',
        actor_id: account.lastInsertRowid,
        action: 'CREATOR_SIGNUP',
        ip_address: req.ip,
      });

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: account.lastInsertRowid,
            username,
            slug,
            display_name,
            sport,
            avatar_url: '',
            email,
          },
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
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const { email, password } = req.body;

      const account = db
        .prepare(
          `SELECT ca.*, c.id as creator_id, c.username, c.slug, c.display_name,
           c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified
           FROM creator_accounts ca JOIN creators c ON ca.creator_id = c.id
           WHERE ca.email = ?`
        )
        .get(email);

      if (!account) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      if (account.is_suspended) {
        return res.status(403).json({ success: false, error: 'Account suspended' });
      }

      const valid = bcrypt.compareSync(password, account.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      db.prepare('UPDATE creator_accounts SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(account.id);

      const token = signToken({ sub: account.id, type: 'creator' });

      audit.log({ actor_type: 'creator', actor_id: account.id, action: 'CREATOR_LOGIN', ip_address: req.ip });

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: account.id,
            creator_id: account.creator_id,
            username: account.username,
            slug: account.slug,
            display_name: account.display_name,
            bio: account.bio,
            avatar_url: account.avatar_url,
            sport: account.sport,
            location: account.location,
            follower_count: account.follower_count,
            is_verified: account.is_verified,
            email,
          },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get('/me', requireAuth, (req, res) => {
  try {
    const { password_hash, ...user } = req.user;
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
