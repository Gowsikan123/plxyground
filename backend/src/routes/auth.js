'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { slugify } = require('../utils/slugify');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../logger');

const router = Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-z0-9_]+$/i),
    body('display_name').trim().isLength({ min: 1, max: 80 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, username, display_name, bio = '', sport = '', location = '' } = req.body;
      const existing = db.prepare('SELECT id FROM creator_accounts WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ error: 'Email already registered.' });

      const existingUser = db.prepare('SELECT id FROM creators WHERE username = ?').get(username);
      if (existingUser) return res.status(409).json({ error: 'Username taken.' });

      const hash = await bcrypt.hash(password, 12);
      const slug = slugify(display_name) + '-' + uuidv4().slice(0, 6);

      const creator = db.prepare(
        'INSERT INTO creators (username, slug, display_name, bio, sport, location) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(username, slug, display_name, bio, sport, location);

      db.prepare(
        'INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)'
      ).run(creator.lastInsertRowid, email, hash);

      const c = db.prepare('SELECT * FROM creators WHERE id = ?').get(creator.lastInsertRowid);
      const token = signToken({ id: c.id, role: 'creator', slug: c.slug });

      logAudit({ actorType: 'creator', actorId: c.id, action: 'signup', targetType: 'creator', targetId: c.id, ipAddress: req.ip });

      res.status(201).json({ token, creator: sanitizeCreator(c) });
    } catch (err) {
      logger.error('Creator signup error', { message: err.message });
      res.status(500).json({ error: 'Signup failed.' });
    }
  }
);

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
      const account = db.prepare('SELECT * FROM creator_accounts WHERE email = ?').get(email);
      if (!account) return res.status(401).json({ error: 'Invalid credentials.' });
      if (account.is_suspended) return res.status(403).json({ error: 'Account suspended.' });

      const valid = await bcrypt.compare(password, account.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

      db.prepare('UPDATE creator_accounts SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(account.id);
      const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(account.creator_id);
      const token = signToken({ id: creator.id, role: account.role, slug: creator.slug });

      logAudit({ actorType: 'creator', actorId: creator.id, action: 'login', ipAddress: req.ip });

      res.json({ token, creator: sanitizeCreator(creator) });
    } catch (err) {
      logger.error('Creator login error', { message: err.message });
      res.status(500).json({ error: 'Login failed.' });
    }
  }
);

router.get('/me', require('../middleware/auth').requireAuth('creator'), (req, res) => {
  try {
    const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.user.id);
    if (!creator) return res.status(404).json({ error: 'Creator not found.' });
    res.json({ creator: sanitizeCreator(creator) });
  } catch (err) {
    logger.error('Creator /me error', { message: err.message });
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

function sanitizeCreator(c) {
  return {
    id: c.id,
    username: c.username,
    slug: c.slug,
    display_name: c.display_name,
    bio: c.bio,
    avatar_url: c.avatar_url,
    sport: c.sport,
    location: c.location,
    follower_count: c.follower_count,
    is_verified: c.is_verified,
    created_at: c.created_at,
  };
}

module.exports = router;
