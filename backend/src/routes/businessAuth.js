'use strict';

const router = require('express').Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const audit = require('../utils/auditLogger');
const logger = require('../logger');

const signupValidation = [
  body('business_name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('industry').trim().isLength({ min: 1, max: 80 }),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// POST /api/business/signup
router.post('/signup', authLimiter, signupValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { business_name, email, password, industry, website, description, location } = req.body;

  try {
    const exists = await db.query('SELECT id FROM businesses WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO businesses
         (business_name, email, password_hash, industry, website, description, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, business_name, email, industry, website, description, location, created_at`,
      [business_name, email, password_hash, industry, website || null, description || null, location || null]
    );

    const business = rows[0];
    const token = signToken({ sub: business.id, role: 'business' });

    audit(business.id, 'business', 'business.signup', { business_name, email });
    logger.info('Business signed up', { id: business.id, business_name });

    return res.status(201).json({ token, business });
  } catch (err) {
    logger.error('Business signup error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/business/login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { email, password } = req.body;

  try {
    const { rows } = await db.query(
      'SELECT id, business_name, email, industry, password_hash, is_suspended FROM businesses WHERE email = $1',
      [email]
    );

    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const business = rows[0];

    if (business.is_suspended) return res.status(403).json({ error: 'Account suspended' });

    const valid = await bcrypt.compare(password, business.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: business.id, role: 'business' });
    const { password_hash: _, ...safeBusiness } = business;

    audit(business.id, 'business', 'business.login', { email });
    logger.info('Business logged in', { id: business.id });

    return res.json({ token, business: safeBusiness });
  } catch (err) {
    logger.error('Business login error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/business/me
router.get('/me', requireAuth('business'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, business_name, email, industry, website, description, location, is_verified, created_at
       FROM businesses WHERE id = $1`,
      [req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    return res.json({ business: rows[0] });
  } catch (err) {
    logger.error('Business /me error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/business/content — business sees all content from creators
router.get('/content', requireAuth('business'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const sport = req.query.sport || null;

    const params = [limit, offset];
    let sportClause = '';
    if (sport) {
      params.push(sport);
      sportClause = `AND cr.sport = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT c.id, c.title, c.body, c.media_url, c.content_type, c.status,
              c.created_at, cr.display_name, cr.username, cr.sport, cr.slug
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       WHERE c.status = 'approved'
       ${sportClause}
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    return res.json({ content: rows, limit, offset });
  } catch (err) {
    logger.error('Business content list error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
