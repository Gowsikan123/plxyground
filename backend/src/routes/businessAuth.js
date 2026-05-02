'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { slugify, ensureUniqueSlug } = require('../utils/slugify');
const { validationErrorHandler } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const audit = require('../utils/auditLogger');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post(
  '/auth/signup',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a digit'),
    body('company_name').trim().isLength({ min: 1, max: 80 }).withMessage('Company name is required (max 80 chars)'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { email, password, company_name, industry = '', website = '', location = '' } = req.body;
      const existing = db.prepare('SELECT id FROM businesses WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ success: false, error: 'Email already registered.' });

      const hash = bcrypt.hashSync(password, 12);
      let slug = slugify(company_name);
      slug = ensureUniqueSlug(db, 'businesses', slug);

      const result = db.prepare(
        'INSERT INTO businesses (email, password_hash, company_name, slug, industry, website, location) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(email, hash, company_name, slug, industry, website, location);

      const token = signToken({ sub: result.lastInsertRowid, type: 'business' });
      audit.log({ actor_type: 'business', actor_id: result.lastInsertRowid, action: 'BUSINESS_SIGNUP', ip_address: req.ip });

      return res.status(201).json({
        success: true,
        data: {
          token,
          business: { id: result.lastInsertRowid, company_name, slug, industry, logo_url: '', email },
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.post(
  '/auth/login',
  authLimiter,
  [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const business = db.prepare('SELECT * FROM businesses WHERE email = ?').get(email);
      if (!business) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
      if (business.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended.' });
      const valid = bcrypt.compareSync(password, business.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
      db.prepare('UPDATE businesses SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(business.id);
      const token = signToken({ sub: business.id, type: 'business' });
      const { password_hash, ...safe } = business;
      return res.json({ success: true, data: { token, business: safe } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get('/auth/me', requireAuth, (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Business access only.' });
  const { password_hash, ...safe } = req.user;
  return res.json({ success: true, data: safe });
});

router.post(
  '/content',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title is required'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Business access only.' });
      const { title, body: bodyText = '', media_url = '', budget_range = '', target_sport = '' } = req.body;
      const result = db.prepare(
        'INSERT INTO business_content (business_id, title, body, media_url, budget_range, target_sport, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(req.user.id, title, bodyText, media_url, budget_range, target_sport, 'pending');
      db.prepare('INSERT INTO moderation_queue (content_type, content_id) VALUES (?, ?)').run('business_content', result.lastInsertRowid);
      audit.log({ actor_type: 'business', actor_id: req.user.id, action: 'BUSINESS_CONTENT_CREATED', target_type: 'business_content', target_id: result.lastInsertRowid, ip_address: req.ip });
      const row = db.prepare('SELECT * FROM business_content WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json({ success: true, data: row });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get('/content/mine', requireAuth, (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Business access only.' });
  const rows = db.prepare('SELECT * FROM business_content WHERE business_id = ? ORDER BY created_at DESC').all(req.user.id);
  return res.json({ success: true, data: rows });
});

router.put('/content/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Business access only.' });
    const row = db.prepare('SELECT * FROM business_content WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found.' });
    if (row.business_id !== req.user.id) return res.status(403).json({ success: false, error: 'Forbidden.' });
    const { title = row.title, body: bodyText = row.body, media_url = row.media_url, budget_range = row.budget_range, target_sport = row.target_sport } = req.body;
    const contentChanged = (title !== row.title || bodyText !== row.body);
    const newStatus = contentChanged && row.status === 'published' ? 'pending' : row.status;
    db.prepare('UPDATE business_content SET title=?, body=?, media_url=?, budget_range=?, target_sport=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(title, bodyText, media_url, budget_range, target_sport, newStatus, row.id);
    if (contentChanged && row.status === 'published') {
      db.prepare('INSERT INTO moderation_queue (content_type, content_id) VALUES (?, ?)').run('business_content', row.id);
    }
    const updated = db.prepare('SELECT * FROM business_content WHERE id = ?').get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
