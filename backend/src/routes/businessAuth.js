'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const { slugify } = require('../utils/slugify');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');

const router = Router();

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('company_name').trim().isLength({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, company_name, industry = '', website = '', location = '', bio = '' } = req.body;
      const existing = db.prepare('SELECT id FROM businesses WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ error: 'Email already registered.' });

      const hash = await bcrypt.hash(password, 12);
      const slug = slugify(company_name) + '-' + uuidv4().slice(0, 6);

      const biz = db.prepare(
        'INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(email, hash, company_name, slug, bio, industry, website, location);

      const b = db.prepare('SELECT * FROM businesses WHERE id = ?').get(biz.lastInsertRowid);
      const token = signToken({ id: b.id, role: 'business', slug: b.slug });

      logAudit({ actorType: 'business', actorId: b.id, action: 'signup', ipAddress: req.ip });

      res.status(201).json({ token, business: sanitizeBusiness(b) });
    } catch (err) {
      logger.error('Business signup error', { message: err.message });
      res.status(500).json({ error: 'Signup failed.' });
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
      const biz = db.prepare('SELECT * FROM businesses WHERE email = ?').get(email);
      if (!biz) return res.status(401).json({ error: 'Invalid credentials.' });
      if (biz.is_suspended) return res.status(403).json({ error: 'Account suspended.' });

      const valid = await bcrypt.compare(password, biz.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

      db.prepare('UPDATE businesses SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(biz.id);
      const token = signToken({ id: biz.id, role: 'business', slug: biz.slug });

      logAudit({ actorType: 'business', actorId: biz.id, action: 'login', ipAddress: req.ip });

      res.json({ token, business: sanitizeBusiness(biz) });
    } catch (err) {
      logger.error('Business login error', { message: err.message });
      res.status(500).json({ error: 'Login failed.' });
    }
  }
);

router.get('/me', require('../middleware/auth').requireAuth('business'), (req, res) => {
  try {
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    if (!biz) return res.status(404).json({ error: 'Business not found.' });
    res.json({ business: sanitizeBusiness(biz) });
  } catch (err) {
    logger.error('Business /me error', { message: err.message });
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

router.patch('/me', require('../middleware/auth').requireAuth('business'), [
  body('company_name').optional().trim().isLength({ min: 1 }),
  body('bio').optional().trim(),
  body('industry').optional().trim(),
  body('website').optional().trim().isURL({ require_protocol: false }),
  body('location').optional().trim(),
  body('logo_url').optional().trim(),
], validate, (req, res) => {
  try {
    const { company_name, bio, industry, website, location, logo_url } = req.body;
    const fields = [];
    const values = [];
    if (company_name !== undefined) { fields.push('company_name = ?'); values.push(company_name); }
    if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }
    if (industry !== undefined) { fields.push('industry = ?'); values.push(industry); }
    if (website !== undefined) { fields.push('website = ?'); values.push(website); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (logo_url !== undefined) { fields.push('logo_url = ?'); values.push(logo_url); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    values.push(req.user.id);
    db.prepare(`UPDATE businesses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    res.json({ business: sanitizeBusiness(biz) });
  } catch (err) {
    logger.error('Business patch error', { message: err.message });
    res.status(500).json({ error: 'Update failed.' });
  }
});

function sanitizeBusiness(b) {
  return {
    id: b.id,
    email: b.email,
    company_name: b.company_name,
    slug: b.slug,
    bio: b.bio,
    logo_url: b.logo_url,
    industry: b.industry,
    website: b.website,
    location: b.location,
    created_at: b.created_at,
  };
}

module.exports = router;
