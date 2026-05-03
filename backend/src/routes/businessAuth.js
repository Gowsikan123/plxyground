'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { slugify, ensureUniqueSlug } = require('../utils/slugify');
const audit = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

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
  (req, res) => {
    try {
      const { email, password, company_name, industry = '', website = '', location = '', bio = '' } = req.body;

      const existing = db.prepare('SELECT id FROM businesses WHERE email = ?').get(email);
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }

      const passwordHash = bcrypt.hashSync(password, 12);
      const baseSlug = slugify(company_name);
      const slug = ensureUniqueSlug('businesses', baseSlug);

      const biz = db
        .prepare(
          'INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(email, passwordHash, company_name, slug, bio, industry, website, location);

      const token = signToken({ sub: biz.lastInsertRowid, type: 'business' });

      audit.log({
        actor_type: 'business',
        actor_id: biz.lastInsertRowid,
        action: 'BUSINESS_SIGNUP',
        ip_address: req.ip,
      });

      return res.status(201).json({
        success: true,
        data: {
          token,
          business: { id: biz.lastInsertRowid, company_name, slug, industry, logo_url: '', email },
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
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const { email, password } = req.body;
      const biz = db.prepare('SELECT * FROM businesses WHERE email = ?').get(email);
      if (!biz) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      if (biz.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended' });

      const valid = bcrypt.compareSync(password, biz.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      db.prepare('UPDATE businesses SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(biz.id);
      const token = signToken({ sub: biz.id, type: 'business' });
      audit.log({ actor_type: 'business', actor_id: biz.id, action: 'BUSINESS_LOGIN', ip_address: req.ip });

      const { password_hash, ...bizSafe } = biz;
      return res.json({ success: true, data: { token, business: bizSafe } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

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

router.post(
  '/content',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title required'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      if (req.userType !== 'business') {
        return res.status(403).json({ success: false, error: 'Business access required' });
      }
      const { title, body: bodyText = '', budget_range = '', target_sport = '', media_url = '' } = req.body;
      const row = db
        .prepare(
          "INSERT INTO business_content (business_id, title, body, media_url, budget_range, target_sport, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')"
        )
        .run(req.user.id, title, bodyText, media_url, budget_range, target_sport);

      db.prepare("INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', ?)").run(row.lastInsertRowid);
      audit.log({ actor_type: 'business', actor_id: req.user.id, action: 'BUSINESS_CONTENT_CREATED', target_type: 'business_content', target_id: row.lastInsertRowid, ip_address: req.ip });

      const created = db.prepare('SELECT * FROM business_content WHERE id = ?').get(row.lastInsertRowid);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.get('/content/mine', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Business access required' });
    const rows = db
      .prepare("SELECT * FROM business_content WHERE business_id = ? AND status != 'deleted' ORDER BY created_at DESC")
      .all(req.user.id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/content/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Business access required' });
    const existing = db.prepare('SELECT * FROM business_content WHERE id = ? AND business_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Content not found' });

    const { title, body: bodyText, budget_range, target_sport, media_url } = req.body;
    const newTitle = title !== undefined ? title : existing.title;
    const newBody = bodyText !== undefined ? bodyText : existing.body;
    const newBudget = budget_range !== undefined ? budget_range : existing.budget_range;
    const newSport = target_sport !== undefined ? target_sport : existing.target_sport;
    const newMedia = media_url !== undefined ? media_url : existing.media_url;

    let newStatus = existing.status;
    if ((title !== undefined || bodyText !== undefined) && existing.status === 'published') {
      newStatus = 'pending';
      db.prepare("INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', ?)").run(existing.id);
    }

    db.prepare('UPDATE business_content SET title=?, body=?, budget_range=?, target_sport=?, media_url=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(newTitle, newBody, newBudget, newSport, newMedia, newStatus, existing.id);

    const updated = db.prepare('SELECT * FROM business_content WHERE id = ?').get(existing.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
