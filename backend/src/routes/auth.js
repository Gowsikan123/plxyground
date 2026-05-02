'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { uniqueUserSlug } = require('../utils/slugify');
const auditLog = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const config = require('../config');
const logger = require('../logger');

// POST /api/auth/signup
router.post(
  '/signup',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('display_name').optional().trim().isLength({ max: 100 }),
    body('sport').optional().trim().isLength({ max: 50 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { username, email, password, display_name, sport, position, location } = req.body;

      const { rows: existing } = await db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );
      if (existing.length) {
        return res.status(409).json({ error: 'Email or username already in use' });
      }

      const password_hash = await bcrypt.hash(password, config.bcrypt.rounds);
      const slug = await uniqueUserSlug(username);

      const { rows } = await db.query(
        `INSERT INTO users (username, email, password_hash, display_name, sport, position, location, slug, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'creator')
         RETURNING id, username, email, display_name, slug, role, created_at`,
        [username, email, password_hash, display_name || username, sport || null, position || null, location || null, slug]
      );

      const user = rows[0];
      const accessToken = signAccessToken({ sub: user.id, role: user.role, type: 'creator' });
      const refreshToken = signRefreshToken({ sub: user.id, type: 'creator' });

      auditLog({ actorId: user.id, actorType: 'creator', action: 'creator.signup', ip: req.ip });

      res.status(201).json({ user, accessToken, refreshToken });
    } catch (err) {
      logger.error('auth.signup error', { message: err.message });
      res.status(500).json({ error: 'Signup failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const { rows } = await db.query(
        'SELECT id, username, email, password_hash, display_name, slug, role, is_suspended FROM users WHERE email = $1',
        [email]
      );
      if (!rows.length) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (user.is_suspended) {
        return res.status(403).json({ error: 'Account suspended' });
      }

      const accessToken = signAccessToken({ sub: user.id, role: user.role, type: 'creator' });
      const refreshToken = signRefreshToken({ sub: user.id, type: 'creator' });

      delete user.password_hash;
      auditLog({ actorId: user.id, actorType: 'creator', action: 'creator.login', ip: req.ip });

      res.json({ user, accessToken, refreshToken });
    } catch (err) {
      logger.error('auth.login error', { message: err.message });
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const { rows } = await db.query(
      'SELECT id, role, is_suspended FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!rows.length || rows[0].is_suspended) {
      return res.status(401).json({ error: 'Account not found or suspended' });
    }

    const user = rows[0];
    const accessToken = signAccessToken({ sub: user.id, role: user.role, type: 'creator' });
    res.json({ accessToken });
  } catch (err) {
    logger.error('auth.refresh error', { message: err.message });
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, email, display_name, bio, avatar_url, sport, position, location,
              follower_count, following_count, is_verified, slug, role, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    logger.error('auth.me error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
