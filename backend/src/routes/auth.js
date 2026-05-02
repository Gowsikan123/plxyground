'use strict';

const router = require('express').Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const audit = require('../utils/auditLogger');
const slugify = require('../utils/slugify');
const logger = require('../logger');

const signupValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('display_name').trim().isLength({ min: 1, max: 80 }),
  body('sport').trim().isLength({ min: 1, max: 60 }),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// POST /api/auth/signup
router.post('/signup', authLimiter, signupValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { username, email, password, display_name, sport, bio, location, instagram_handle, tiktok_handle } = req.body;

  try {
    const exists = await db.query(
      'SELECT id FROM creators WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const slug = await slugify(username, 'creators');

    const { rows } = await db.query(
      `INSERT INTO creators
         (username, email, password_hash, display_name, sport, bio, location, instagram_handle, tiktok_handle, slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, username, email, display_name, sport, slug, created_at`,
      [username, email, password_hash, display_name, sport, bio || null, location || null, instagram_handle || null, tiktok_handle || null, slug]
    );

    const creator = rows[0];
    const token = signToken({ sub: creator.id, role: 'creator' });

    audit(creator.id, 'creator', 'creator.signup', { username, email });
    logger.info('Creator signed up', { id: creator.id, username });

    return res.status(201).json({ token, creator });
  } catch (err) {
    logger.error('Creator signup error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { email, password } = req.body;

  try {
    const { rows } = await db.query(
      'SELECT id, username, email, display_name, sport, slug, password_hash, is_suspended FROM creators WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const creator = rows[0];

    if (creator.is_suspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    const valid = await bcrypt.compare(password, creator.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ sub: creator.id, role: 'creator' });
    const { password_hash: _, ...safeCreator } = creator;

    audit(creator.id, 'creator', 'creator.login', { email });
    logger.info('Creator logged in', { id: creator.id });

    return res.json({ token, creator: safeCreator });
  } catch (err) {
    logger.error('Creator login error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth('creator'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, email, display_name, sport, bio, location,
              instagram_handle, tiktok_handle, slug, follower_count,
              is_verified, created_at
       FROM creators WHERE id = $1`,
      [req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('Creator /me error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
