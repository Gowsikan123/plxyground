'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { uniqueSlug } = require('../utils/slugify');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const auditLogger = require('../utils/auditLogger');

const router = express.Router();

router.post(
  '/auth/signup',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required.'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain a number.'),
    body('company_name').isLength({ min: 1, max: 80 }).withMessage('Company name required (max 80 chars).'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, company_name, industry, website, location } = req.body;
      const hash = await bcrypt.hash(password, 12);
      const slug = await uniqueSlug(company_name, 'businesses', 'slug');
      const { rows } = await pool.query(
        `INSERT INTO businesses (email, password_hash, company_name, slug, industry, website, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, company_name, slug, industry, logo_url`,
        [email, hash, company_name, slug, industry || null, website || null, location || null]
      );
      const business = rows[0];
      const token = signToken({ sub: business.id, type: 'business' });
      await auditLogger.log({ actor_type: 'business', actor_id: business.id, action: 'BUSINESS_SIGNUP', ip_address: req.ip });
      return res.status(201).json({ token, business });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email already registered.' });
      return res.status(500).json({ error: 'Server error.' });
    }
  }
);

router.post(
  '/auth/login',
  authLimiter,
  [
    body('email').notEmpty().withMessage('Email required.'),
    body('password').notEmpty().withMessage('Password required.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const { rows } = await pool.query('SELECT * FROM businesses WHERE email = $1', [email]);
      const biz = rows[0];
      if (!biz) return res.status(401).json({ error: 'Invalid credentials.' });
      if (biz.is_suspended) return res.status(403).json({ error: 'Account suspended.' });
      const valid = await bcrypt.compare(password, biz.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
      await pool.query('UPDATE businesses SET last_login = NOW() WHERE id = $1', [biz.id]);
      const token = signToken({ sub: biz.id, type: 'business' });
      return res.json({
        token,
        business: { id: biz.id, company_name: biz.company_name, slug: biz.slug, industry: biz.industry, logo_url: biz.logo_url, email: biz.email },
      });
    } catch (err) {
      return res.status(500).json({ error: 'Server error.' });
    }
  }
);

router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ error: 'Business access only.' });
    return res.json({ business: req.user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/content', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ error: 'Business access only.' });
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    const { rows } = await pool.query(
      `INSERT INTO business_content (business_id, title, body, budget_range, target_sport)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, bodyText || null, budget_range || null, target_sport || null]
    );
    const content = rows[0];
    await pool.query(
      `INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)`,
      [content.id]
    );
    await auditLogger.log({ actor_type: 'business', actor_id: req.user.id, action: 'BUSINESS_CONTENT_CREATED', target_type: 'business_content', target_id: content.id, ip_address: req.ip });
    return res.status(201).json({ content });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/content/mine', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ error: 'Business access only.' });
    const { rows } = await pool.query(
      'SELECT * FROM business_content WHERE business_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ data: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/content/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ error: 'Business access only.' });
    const { rows: existing } = await pool.query(
      'SELECT * FROM business_content WHERE id = $1 AND business_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Content not found or not yours.' });
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    const requeue = title !== existing[0].title || bodyText !== existing[0].body;
    const { rows } = await pool.query(
      `UPDATE business_content SET title = COALESCE($1, title), body = COALESCE($2, body),
       budget_range = COALESCE($3, budget_range), target_sport = COALESCE($4, target_sport),
       status = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title || null, bodyText || null, budget_range || null, target_sport || null,
       requeue ? 'pending' : existing[0].status, req.params.id]
    );
    if (requeue) {
      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)`,
        [req.params.id]
      );
    }
    return res.json({ content: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
