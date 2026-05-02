'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { auditLog } = require('../utils/auditLogger');
const { slugify, uniqueSlug } = require('../utils/slugify');
const config = require('../config');
const logger = require('../logger');

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 chars'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
    body('display_name').optional().trim().isLength({ max: 100 }),
    body('sport').optional().trim().isLength({ max: 50 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { username, email, password, display_name, sport } = req.body;

      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username],
      );
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Email or username already taken' });
      }

      const password_hash = await bcrypt.hash(password, config.bcrypt.rounds);
      const baseSlug = slugify(display_name || username);
      const slug = await uniqueSlug(baseSlug, 'users');

      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, display_name, sport, slug)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, username, email, display_name, sport, slug, created_at`,
        [username, email, password_hash, display_name || username, sport || null, slug],
      );

      const user = result.rows[0];
      const token = signToken({ id: user.id, username: user.username, type: 'user' });

      auditLog({ actorId: user.id, actorType: 'user', action: 'auth.signup', ip: req.ip });
      return res.status(201).json({ token, user });
    } catch (err) {
      logger.error('auth.signup error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await db.query(
        'SELECT id, username, email, password_hash, display_name, sport, slug, is_suspended FROM users WHERE email = $1',
        [email],
      );
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      if (user.is_suspended) {
        return res.status(403).json({ error: 'Account suspended' });
      }

      const { password_hash, ...safeUser } = user;
      const token = signToken({ id: user.id, username: user.username, type: 'user' });

      auditLog({ actorId: user.id, actorType: 'user', action: 'auth.login', ip: req.ip });
      return res.json({ token, user: safeUser });
    } catch (err) {
      logger.error('auth.login error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, display_name, bio, avatar_url, sport, slug, is_verified, follower_count, created_at FROM users WHERE id = $1',
      [req.user.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    logger.error('auth.me error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
