'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { uniqueSlug } = require('../utils/slugify');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const auditLogger = require('../utils/auditLogger');
const logger = require('../logger');

const router = express.Router();

router.post('/signup', authLimiter, [
  body('email').isEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('company_name').trim().isLength({ min: 1, max: 80 }).withMessage('Company name must be 1-80 characters.'),
], handleValidation, async (req, res) => {
  try {
    const { email, password, company_name, industry, website, location } = req.body;
    const check = await pool.query('SELECT 1 FROM businesses WHERE email = $1', [email.toLowerCase()]);
    if (check.rows.length > 0) return res.status(409).json({ error: 'Email already registered.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const slug = await uniqueSlug(company_name, 'businesses');
    const res2 = await pool.query(
      'INSERT INTO businesses (email, password_hash, company_name, slug, industry, website, location) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [email.toLowerCase(), passwordHash, company_name, slug, industry || null, website || null, location || null]
    );
    const biz = res2.rows[0];
    const token = signToken({ sub: biz.id, type: 'business' });
    return res.status(201).json({
      token,
      business: { id: biz.id, company_name: biz.company_name, slug: biz.slug, industry: biz.industry, logo_url: biz.logo_url },
    });
  } catch (err) {
    logger.error('POST /api/business/auth/signup', { message: err.message });
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', authLimiter, [
  body('email').notEmpty().withMessage('Email required.'),
  body('password').notEmpty().withMessage('Password required.'),
], handleValidation, async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM businesses WHERE email = $1', [email.toLowerCase()]);
    if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials.' });
    const biz = rows[0];
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
    logger.error('POST /api/business/auth/login', { message: err.message });
    return res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business access only.' });
  return res.json({ business: req.user });
});

router.post('/content', requireAuth, [
  body('title').trim().notEmpty().withMessage('Title is required.'),
], handleValidation, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business access only.' });
  try {
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    const contentRes = await pool.query(
      'INSERT INTO business_content (business_id, title, body, budget_range, target_sport) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, title, bodyText || null, budget_range || null, target_sport || null]
    );
    const content = contentRes.rows[0];
    await pool.query('INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)', ['business_content', content.id]);
    await auditLogger.log({ actor_type: 'business', actor_id: req.user.id, action: 'BUSINESS_CONTENT_CREATED', target_type: 'business_content', target_id: content.id, ip_address: req.ip });
    return res.status(201).json({ content });
  } catch (err) {
    logger.error('POST /api/business/auth/content', { message: err.message });
    return res.status(500).json({ error: 'Failed to create content.' });
  }
});

router.get('/content/mine', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business access only.' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM business_content WHERE business_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/business/auth/content/mine', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

router.put('/content/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business access only.' });
  try {
    const { rows } = await pool.query('SELECT * FROM business_content WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Content not found.' });
    if (rows[0].business_id !== req.user.id) return res.status(403).json({ error: 'Not your content.' });
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    const changed = (title && title !== rows[0].title) || (bodyText && bodyText !== rows[0].body);
    const newStatus = changed ? 'pending' : rows[0].status;
    const updated = await pool.query(
      'UPDATE business_content SET title=COALESCE($1,title), body=COALESCE($2,body), budget_range=COALESCE($3,budget_range), target_sport=COALESCE($4,target_sport), status=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [title || null, bodyText || null, budget_range || null, target_sport || null, newStatus, req.params.id]
    );
    if (changed) {
      await pool.query('INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)', ['business_content', rows[0].id]);
    }
    return res.json({ content: updated.rows[0] });
  } catch (err) {
    logger.error('PUT /api/business/auth/content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update content.' });
  }
});

module.exports = router;
