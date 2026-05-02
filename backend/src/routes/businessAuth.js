'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const auditLog = require('../utils/auditLogger');
const { requireAuth, requireBusiness } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const config = require('../config');
const logger = require('../logger');

// POST /api/business/signup
router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('company_name').trim().isLength({ min: 2, max: 150 }),
    body('industry').optional().trim().isLength({ max: 100 }),
    body('website').optional().isURL(),
    body('contact_name').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, company_name, industry, website, contact_name, contact_phone, description } = req.body;

      const { rows: existing } = await db.query(
        'SELECT id FROM businesses WHERE email = $1',
        [email]
      );
      if (existing.length) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const password_hash = await bcrypt.hash(password, config.bcrypt.rounds);
      const { rows } = await db.query(
        `INSERT INTO businesses (email, password_hash, company_name, industry, website, contact_name, contact_phone, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, company_name, industry, website, is_verified, created_at`,
        [email, password_hash, company_name, industry || null, website || null, contact_name || null, contact_phone || null, description || null]
      );

      const biz = rows[0];
      const accessToken = signAccessToken({ sub: biz.id, type: 'business' });
      const refreshToken = signRefreshToken({ sub: biz.id, type: 'business' });

      auditLog({ actorId: biz.id, actorType: 'business', action: 'business.signup', ip: req.ip });

      res.status(201).json({ business: biz, accessToken, refreshToken });
    } catch (err) {
      logger.error('businessAuth.signup error', { message: err.message });
      res.status(500).json({ error: 'Signup failed' });
    }
  }
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

      const { rows } = await db.query(
        'SELECT id, email, company_name, password_hash, is_suspended, is_verified FROM businesses WHERE email = $1',
        [email]
      );
      if (!rows.length) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const biz = rows[0];
      const match = await bcrypt.compare(password, biz.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      if (biz.is_suspended) return res.status(403).json({ error: 'Account suspended' });

      const accessToken = signAccessToken({ sub: biz.id, type: 'business' });
      const refreshToken = signRefreshToken({ sub: biz.id, type: 'business' });

      delete biz.password_hash;
      auditLog({ actorId: biz.id, actorType: 'business', action: 'business.login', ip: req.ip });

      res.json({ business: biz, accessToken, refreshToken });
    } catch (err) {
      logger.error('businessAuth.login error', { message: err.message });
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/business/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const payload = verifyRefreshToken(refreshToken);
    if (!payload || payload.type !== 'business') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { rows } = await db.query(
      'SELECT id, is_suspended FROM businesses WHERE id = $1',
      [payload.sub]
    );
    if (!rows.length || rows[0].is_suspended) {
      return res.status(401).json({ error: 'Account not found or suspended' });
    }

    const accessToken = signAccessToken({ sub: rows[0].id, type: 'business' });
    res.json({ accessToken });
  } catch (err) {
    logger.error('businessAuth.refresh error', { message: err.message });
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// GET /api/business/me
router.get('/me', requireAuth, requireBusiness, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, email, company_name, industry, website, logo_url, description,
              contact_name, contact_phone, is_verified, created_at
       FROM businesses WHERE id = $1`,
      [req.business.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Business not found' });
    res.json({ business: rows[0] });
  } catch (err) {
    logger.error('businessAuth.me error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
