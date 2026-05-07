'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const sql = require('../db/client');
const { signToken } = require('../utils/jwt');
const { slugify, ensureUniqueSlug } = require('../utils/slugify');
const audit = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/business/auth/signup
router.post(
  '/auth/signup',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a digit'),
    body('company_name').isLength({ min: 1, max: 80 }).withMessage('Company name required (max 80 chars)'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { email, password, company_name, industry = '', website = '', location = '', bio = '' } = req.body;

      const [existing] = await sql`SELECT id FROM businesses WHERE email = ${email}`;
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const baseSlug = slugify(company_name);
      const slug = await ensureUniqueSlug('businesses', baseSlug);

      const [biz] = await sql`
        INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location)
        VALUES (${email}, ${passwordHash}, ${company_name}, ${slug}, ${bio}, ${industry}, ${website}, ${location})
        RETURNING id, company_name, slug, industry, logo_url, email`;

      const token = signToken({ sub: biz.id, type: 'business' });

      await audit.log({
        actor_type: 'business',
        actor_id: biz.id,
        action: 'BUSINESS_SIGNUP',
        ip_address: req.ip,
      });

      return res.status(201).json({
        success: true,
        data: { token, business: biz },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/business/auth/login
router.post(
  '/auth/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const [biz] = await sql`SELECT * FROM businesses WHERE email = ${email}`;
      if (!biz) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      if (biz.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended' });

      const valid = await bcrypt.compare(password, biz.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      await sql`UPDATE businesses SET last_login = NOW() WHERE id = ${biz.id}`;
      const token = signToken({ sub: biz.id, type: 'business' });

      await audit.log({ actor_type: 'business', actor_id: biz.id, action: 'BUSINESS_LOGIN', ip_address: req.ip });

      const { password_hash, ...bizSafe } = biz;
      return res.json({ success: true, data: { token, business: bizSafe } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/business/auth/me
router.get('/auth/me', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'business') {
      return res.status(403).json({ success: false, error: 'Business access required' });
    }
    const { password_hash, ...biz } = req.user;
    return res.json({ success: true, data: biz });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/business/content
router.post(
  '/content',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title required'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      if (req.userType !== 'business') {
        return res.status(403).json({ success: false, error: 'Business access required' });
      }
      const { title, body: bodyText = '', budget_range = '', target_sport = '', media_url = '' } = req.body;

      const [row] = await sql`
        INSERT INTO business_content (business_id, title, body, media_url, budget_range, target_sport, status)
        VALUES (${req.user.id}, ${title}, ${bodyText}, ${media_url}, ${budget_range}, ${target_sport}, 'pending')
        RETURNING *`;

      await sql`INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', ${row.id})`;

      await audit.log({
        actor_type: 'business',
        actor_id: req.user.id,
        action: 'BUSINESS_CONTENT_CREATED',
        target_type: 'business_content',
        target_id: row.id,
        ip_address: req.ip,
      });

      return res.status(201).json({ success: true, data: row });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/business/content/mine
router.get('/content/mine', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Business access required' });
    const rows = await sql`
      SELECT * FROM business_content
      WHERE business_id = ${req.user.id} AND status != 'deleted'
      ORDER BY created_at DESC`;
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/business/content/:id
router.put('/content/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Business access required' });

    const [existing] = await sql`
      SELECT * FROM business_content WHERE id = ${req.params.id} AND business_id = ${req.user.id}`;
    if (!existing) return res.status(404).json({ success: false, error: 'Content not found' });

    const { title, body: bodyText, budget_range, target_sport, media_url } = req.body;
    const newTitle      = title        !== undefined ? title        : existing.title;
    const newBody       = bodyText     !== undefined ? bodyText     : existing.body;
    const newBudget     = budget_range !== undefined ? budget_range : existing.budget_range;
    const newSport      = target_sport !== undefined ? target_sport : existing.target_sport;
    const newMedia      = media_url    !== undefined ? media_url    : existing.media_url;

    let newStatus = existing.status;
    if ((title !== undefined || bodyText !== undefined) && existing.status === 'published') {
      newStatus = 'pending';
      await sql`INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', ${existing.id})`;
    }

    const [updated] = await sql`
      UPDATE business_content
      SET title=${newTitle}, body=${newBody}, budget_range=${newBudget},
          target_sport=${newSport}, media_url=${newMedia}, status=${newStatus},
          updated_at=NOW()
      WHERE id=${existing.id}
      RETURNING *`;

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
