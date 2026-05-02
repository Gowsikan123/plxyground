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

// POST /api/business/signup
router.post(
  '/signup',
  authLimiter,
  [
    body('company_name').trim().isLength({ min: 2, max: 150 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('website').optional().isURL(),
    body('bio').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { company_name, email, password, website, bio } = req.body;
      const pool = getPool();

      const { rows: exists } = await pool.query('SELECT id FROM businesses WHERE email = $1', [email]);
      if (exists.length) return res.status(409).json({ error: 'Email already registered' });

      const password_hash = await bcrypt.hash(password, bcryptRounds);
      const slug = await uniqueSlug(company_name, 'businesses');

      const { rows } = await pool.query(
        `INSERT INTO businesses (company_name, email, password_hash, website, bio, slug)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, company_name, email, website, bio, slug, created_at`,
        [company_name, email, password_hash, website || null, bio || null, slug],
      );

      const business = rows[0];
      const token = signToken({ id: business.id, type: 'business' });
      writeAudit({ actorId: business.id, actorType: 'business', action: 'signup', ip: req.ip });

      return res.status(201).json({ token, user: business });
    } catch (err) {
      logger.error('business signup error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/business/login
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
        'SELECT id, email, company_name, password_hash, bio, logo_url, slug, website, is_suspended FROM businesses WHERE email = $1',
        [email],
      );
      const business = rows[0];
      if (!business) return res.status(401).json({ error: 'Invalid credentials' });
      if (business.is_suspended) return res.status(403).json({ error: 'Account suspended' });

      const valid = await bcrypt.compare(password, business.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const { password_hash, ...safe } = business;
      const token = signToken({ id: business.id, type: 'business' });
      writeAudit({ actorId: business.id, actorType: 'business', action: 'login', ip: req.ip });

      return res.json({ token, user: safe });
    } catch (err) {
      logger.error('business login error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/business/me
router.get('/me', requireAuth, async (req, res) => {
  if (req.user.type !== 'business') return res.status(403).json({ error: 'Not a business account' });
  try {
    const { rows } = await getPool().query(
      'SELECT id, company_name, email, bio, logo_url, slug, website, is_verified, created_at FROM businesses WHERE id = $1',
      [req.user.id],
    );
    return res.json({ user: rows[0] });
  } catch (err) {
    logger.error('business me error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
