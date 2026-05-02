'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { validate } = require('../middleware/validate');
const { requireBusiness } = require('../middleware/auth');
const { auditLog } = require('../utils/auditLogger');
const { slugify, uniqueSlug } = require('../utils/slugify');
const config = require('../config');
const logger = require('../logger');

// POST /api/business/signup
router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Business name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
    body('industry').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, industry, description, website } = req.body;

      const existing = await db.query('SELECT id FROM businesses WHERE email = $1', [email]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const password_hash = await bcrypt.hash(password, config.bcrypt.rounds);
      const baseSlug = slugify(name);
      const slug = await uniqueSlug(baseSlug, 'businesses');

      const result = await db.query(
        `INSERT INTO businesses (name, email, password_hash, industry, description, website, slug)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, industry, description, website, slug, created_at`,
        [name, email, password_hash, industry || null, description || null, website || null, slug],
      );

      const biz = result.rows[0];
      const token = signToken({ id: biz.id, name: biz.name, type: 'business' });

      auditLog({ actorId: biz.id, actorType: 'business', action: 'business.signup', ip: req.ip });
      return res.status(201).json({ token, business: biz });
    } catch (err) {
      logger.error('business.signup error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/business/login
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
        'SELECT id, name, email, password_hash, industry, slug, is_suspended FROM businesses WHERE email = $1',
        [email],
      );
      const biz = result.rows[0];

      if (!biz || !(await bcrypt.compare(password, biz.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      if (biz.is_suspended) {
        return res.status(403).json({ error: 'Account suspended' });
      }

      const { password_hash, ...safeBiz } = biz;
      const token = signToken({ id: biz.id, name: biz.name, type: 'business' });

      auditLog({ actorId: biz.id, actorType: 'business', action: 'business.login', ip: req.ip });
      return res.json({ token, business: safeBiz });
    } catch (err) {
      logger.error('business.login error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/business/me
router.get('/me', requireBusiness, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, description, logo_url, website, industry, slug, is_verified, created_at FROM businesses WHERE id = $1',
      [req.business.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Business not found' });
    return res.json({ business: result.rows[0] });
  } catch (err) {
    logger.error('business.me error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
