'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/auth');
const { generateUniqueSlug } = require('../utils/slugify');
const audit = require('../utils/auditLogger');

const router = express.Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('company_name').trim().isLength({ min: 2, max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, company_name, bio, industry, website, location } = req.body;
      const exists = await pool.query('SELECT id FROM businesses WHERE email=$1', [email]);
      if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });
      const slug = await generateUniqueSlug(company_name, 'businesses');
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
        [email, hash, company_name, slug, bio || null, industry || null, website || null, location || null]
      );
      const bizId = result.rows[0].id;
      const token = signToken({ sub: bizId, type: 'business' });
      await audit.log({ actor_type: 'business', actor_id: bizId, action: 'SIGNUP', ip_address: req.ip });
      return res.status(201).json({
        token,
        user: { id: bizId, email, company_name, slug, bio: bio || null, industry: industry || null, website: website || null, location: location || null, logo_url: null, type: 'business' },
      });
    } catch {
      return res.status(500).json({ error: 'Registration failed' });
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
      const result = await pool.query('SELECT * FROM businesses WHERE email=$1', [email]);
      if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const biz = result.rows[0];
      if (biz.is_suspended) return res.status(403).json({ error: 'Account suspended' });
      const valid = await bcrypt.compare(password, biz.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      await pool.query('UPDATE businesses SET last_login=NOW() WHERE id=$1', [biz.id]);
      const token = signToken({ sub: biz.id, type: 'business' });
      await audit.log({ actor_type: 'business', actor_id: biz.id, action: 'LOGIN', ip_address: req.ip });
      return res.json({
        token,
        user: { id: biz.id, email: biz.email, company_name: biz.company_name, slug: biz.slug, bio: biz.bio, industry: biz.industry, website: biz.website, location: biz.location, logo_url: biz.logo_url, type: 'business' },
      });
    } catch {
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ error: 'Business account required' });
    const u = req.user;
    return res.json({ id: u.id, email: u.email, company_name: u.company_name, slug: u.slug, bio: u.bio, industry: u.industry, website: u.website, location: u.location, logo_url: u.logo_url, type: 'business' });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch(
  '/profile',
  requireAuth,
  [
    body('company_name').optional().trim().isLength({ min: 2, max: 100 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('industry').optional().trim().isLength({ max: 80 }),
    body('website').optional().isURL(),
    body('location').optional().trim().isLength({ max: 100 }),
    body('logo_url').optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      if (req.userType !== 'business') return res.status(403).json({ error: 'Business account required' });
      const { company_name, bio, industry, website, location, logo_url } = req.body;
      const result = await pool.query(
        `UPDATE businesses SET
           company_name = COALESCE($1, company_name),
           bio = COALESCE($2, bio),
           industry = COALESCE($3, industry),
           website = COALESCE($4, website),
           location = COALESCE($5, location),
           logo_url = COALESCE($6, logo_url)
         WHERE id=$7 RETURNING *`,
        [company_name || null, bio || null, industry || null, website || null, location || null, logo_url || null, req.user.id]
      );
      return res.json(result.rows[0]);
    } catch {
      return res.status(500).json({ error: 'Profile update failed' });
    }
  }
);

router.get('/content', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ error: 'Business account required' });
    const result = await pool.query('SELECT * FROM business_content WHERE business_id=$1 ORDER BY created_at DESC', [req.user.id]);
    return res.json(result.rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.post(
  '/content',
  requireAuth,
  [
    body('title').trim().isLength({ min: 5, max: 200 }),
    body('body').trim().isLength({ min: 20 }),
  ],
  validate,
  async (req, res) => {
    try {
      if (req.userType !== 'business') return res.status(403).json({ error: 'Business account required' });
      const { title, body: bodyText, budget_range, target_sport } = req.body;
      const result = await pool.query(
        'INSERT INTO business_content (business_id, title, body, budget_range, target_sport) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [req.user.id, title, bodyText, budget_range || null, target_sport || null]
      );
      const content = result.rows[0];
      await pool.query('INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)', ['business_content', content.id]);
      return res.status(201).json(content);
    } catch {
      return res.status(500).json({ error: 'Failed to create content' });
    }
  }
);

module.exports = router;
