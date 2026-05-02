'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const { getPool } = require('../db/client');
const { signToken } = require('../utils/jwt');
const { uniqueSlug } = require('../utils/slugify');
const { writeAudit } = require('../utils/auditLogger');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { bcryptRounds } = require('../config');
const logger = require('../logger');

const router = express.Router();

// POST /api/auth/signup
router.post(
  '/signup',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9_]+$/i).withMessage('Username: 3-50 chars, letters/numbers/underscores only'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('display_name').optional().trim().isLength({ max: 100 }),
    body('sport').optional().trim().isLength({ max: 50 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { username, email, password, display_name, sport, bio } = req.body;
      const pool = getPool();

      const { rows: exists } = await pool.query(
        'SELECT id FROM creators WHERE email = $1 OR username = $2',
        [email, username],
      );
      if (exists.length) return res.status(409).json({ error: 'Email or username already taken' });

      const password_hash = await bcrypt.hash(password, bcryptRounds);
      const slug = await uniqueSlug(display_name || username, 'creators');

      const { rows } = await pool.query(
        `INSERT INTO creators (username, email, password_hash, display_name, sport, bio, slug)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, email, display_name, sport, bio, slug, created_at`,
        [username, email, password_hash, display_name || null, sport || null, bio || null, slug],
      );

      const creator = rows[0];
      const token = signToken({ id: creator.id, type: 'creator' });

      writeAudit({ actorId: creator.id, actorType: 'creator', action: 'signup', ip: req.ip });

      return res.status(201).json({ token, user: creator });
    } catch (err) {
      logger.error('creator signup error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
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
      const { rows } = await getPool().query(
        'SELECT id, email, username, password_hash, display_name, sport, bio, avatar_url, slug, is_suspended FROM creators WHERE email = $1',
        [email],
      );
      const creator = rows[0];
      if (!creator) return res.status(401).json({ error: 'Invalid credentials' });
      if (creator.is_suspended) return res.status(403).json({ error: 'Account suspended' });

      const valid = await bcrypt.compare(password, creator.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const { password_hash, ...safeCreator } = creator;
      const token = signToken({ id: creator.id, type: 'creator' });

      writeAudit({ actorId: creator.id, actorType: 'creator', action: 'login', ip: req.ip });

      return res.json({ token, user: safeCreator });
    } catch (err) {
      logger.error('creator login error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await getPool().query(
      'SELECT id, username, email, display_name, sport, bio, avatar_url, slug, follower_count, is_verified, created_at FROM creators WHERE id = $1',
      [req.user.id],
    );
    return res.json({ user: rows[0] });
  } catch (err) {
    logger.error('creator me error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
