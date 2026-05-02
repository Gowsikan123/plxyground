'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const slugify = require('../utils/slugify');
const auditLog = require('../utils/auditLogger');

const router = Router();

// POST /api/auth/signup
router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('username').isAlphanumeric().isLength({ min: 3, max: 30 }),
    body('displayname').notEmpty().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, username, displayname, sport, location } = req.body;

      const existing = await pool.query(
        'SELECT id FROM creator_accounts WHERE email = $1',
        [email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      const usernameCheck = await pool.query(
        'SELECT id FROM creators WHERE username = $1',
        [username]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      const slug = await slugify(username, 'creators');
      const { rows: creatorRows } = await pool.query(
        `INSERT INTO creators (username, slug, displayname, sport, location)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, username, slug, displayname, sport, location, followercount, isverified, createdat`,
        [username, slug, displayname, sport || null, location || null]
      );
      const creator = creatorRows[0];

      const passwordhash = await bcrypt.hash(password, 12);
      await pool.query(
        `INSERT INTO creator_accounts (creatorid, email, passwordhash) VALUES ($1, $2, $3)`,
        [creator.id, email, passwordhash]
      );

      const token = signToken({ id: creator.id, type: 'creator' });
      auditLog({ actorType: 'creator', actorId: creator.id, action: 'CREATOR_SIGNUP', ipAddress: req.ip });

      return res.status(201).json({ token, creator });
    } catch (err) {
      return res.status(500).json({ error: 'Signup failed', detail: err.message });
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

      const { rows } = await pool.query(
        `SELECT ca.id AS accountid, ca.passwordhash, ca.issuspended, ca.creatorid,
                c.id, c.username, c.slug, c.displayname, c.bio, c.avatarurl,
                c.sport, c.location, c.followercount, c.isverified, c.createdat
         FROM creator_accounts ca
         JOIN creators c ON c.id = ca.creatorid
         WHERE ca.email = $1`,
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const row = rows[0];
      const valid = await bcrypt.compare(password, row.passwordhash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      if (row.issuspended) return res.status(403).json({ error: 'Account suspended' });

      await pool.query(
        'UPDATE creator_accounts SET lastlogin = NOW() WHERE creatorid = $1',
        [row.id]
      );

      const creator = {
        id: row.id, username: row.username, slug: row.slug,
        displayname: row.displayname, bio: row.bio, avatarurl: row.avatarurl,
        sport: row.sport, location: row.location,
        followercount: row.followercount, isverified: row.isverified,
        createdat: row.createdat,
      };

      const token = signToken({ id: creator.id, type: 'creator' });
      auditLog({ actorType: 'creator', actorId: creator.id, action: 'CREATOR_LOGIN', ipAddress: req.ip });

      return res.json({ token, creator });
    } catch (err) {
      return res.status(500).json({ error: 'Login failed', detail: err.message });
    }
  }
);

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.actor.type !== 'creator') {
      return res.status(403).json({ error: 'Creator token required' });
    }
    const { rows } = await pool.query(
      `SELECT c.id, c.username, c.slug, c.displayname, c.bio, c.avatarurl,
              c.sport, c.location, c.followercount, c.isverified, c.createdat,
              ca.email, ca.role, ca.issuspended, ca.isemailverified
       FROM creators c
       JOIN creator_accounts ca ON ca.creatorid = c.id
       WHERE c.id = $1`,
      [req.actor.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile', detail: err.message });
  }
});

module.exports = router;
