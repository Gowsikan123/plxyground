'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { getPool } = require('../db/client');
const { signToken } = require('../utils/jwt');
const { uniqueSlug } = require('../utils/slugify');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const auditLogger = require('../utils/auditLogger');

const router = express.Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('company_name').isLength({ min: 1, max: 80 }).withMessage('Company name must be 1-80 characters'),
  ],
  validate,
  async (req, res) => {
    const pool = getPool();
    const { email, password, company_name, industry, website, location } = req.body;
    try {
      const existing = await pool.query(`SELECT id FROM businesses WHERE email = $1`, [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      const slug = await uniqueSlug(company_name, 'businesses');
      const passwordHash = await bcrypt.hash(password, 12);
      const { rows } = await pool.query(
        `INSERT INTO businesses (email, password_hash, company_name, slug, industry, website, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [email, passwordHash, company_name, slug, industry || null, website || null, location || null]
      );
      const business = rows[0];
      const token = signToken({ sub: business.id, type: 'business' });
      auditLogger.log({ actor_type: 'business', actor_id: business.id, action: 'BUSINESS_SIGNUP', ip_address: req.ip });
      return res.status(201).json({
        token,
        business: { id: business.id, company_name: business.company_name, slug: business.slug, industry: business.industry, logo_url: business.logo_url },
      });
    } catch (err) {
      throw err;
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    const pool = getPool();
    const { email, password } = req.body;
    try {
      const { rows } = await pool.query(`SELECT * FROM businesses WHERE email = $1`, [email]);
      if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
      const business = rows[0];
      if (business.is_suspended) return res.status(403).json({ error: 'Account is suspended. Contact support.' });
      const valid = await bcrypt.compare(password, business.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
      await pool.query(`UPDATE businesses SET last_login = NOW() WHERE id = $1`, [business.id]);
      const token = signToken({ sub: business.id, type: 'business' });
      auditLogger.log({ actor_type: 'business', actor_id: business.id, action: 'BUSINESS_LOGIN', ip_address: req.ip });
      return res.json({
        token,
        business: { id: business.id, company_name: business.company_name, slug: business.slug, industry: business.industry, logo_url: business.logo_url, email: business.email },
      });
    } catch (err) {
      throw err;
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business auth required' });
  return res.json({ business: req.user });
});

router.post('/content', requireAuth, [
  body('title').notEmpty().withMessage('Title is required'),
], validate, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business auth required' });
  const pool = getPool();
  const { title, body: bodyText, budget_range, target_sport } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO business_content (business_id, title, body, budget_range, target_sport) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, title, bodyText || null, budget_range || null, target_sport || null]
    );
    const content = rows[0];
    await pool.query(
      `INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)`,
      [content.id]
    );
    auditLogger.log({ actor_type: 'business', actor_id: req.user.id, action: 'BUSINESS_CONTENT_CREATED', target_type: 'business_content', target_id: content.id, ip_address: req.ip });
    return res.status(201).json({ content });
  } catch (err) {
    throw err;
  }
});

router.get('/content/mine', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business auth required' });
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT * FROM business_content WHERE business_id = $1 AND status != 'deleted' ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ data: rows });
  } catch (err) {
    throw err;
  }
});

router.put('/content/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business auth required' });
  const pool = getPool();
  const { id } = req.params;
  try {
    const { rows: existing } = await pool.query(`SELECT * FROM business_content WHERE id = $1`, [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Content not found' });
    if (existing[0].business_id !== req.user.id) return res.status(403).json({ error: 'Not authorised' });
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    const wasPublished = existing[0].status === 'published';
    const contentChanged = (title && title !== existing[0].title) || (bodyText && bodyText !== existing[0].body);
    const newStatus = wasPublished && contentChanged ? 'pending' : existing[0].status;
    const { rows } = await pool.query(
      `UPDATE business_content SET title = COALESCE($1, title), body = COALESCE($2, body), budget_range = COALESCE($3, budget_range), target_sport = COALESCE($4, target_sport), status = $5, updated_at = NOW() WHERE id = $6 RETURNING *`,
      [title || null, bodyText || null, budget_range || null, target_sport || null, newStatus, id]
    );
    if (wasPublished && contentChanged) {
      await pool.query(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)`, [id]);
    }
    return res.json({ content: rows[0] });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
