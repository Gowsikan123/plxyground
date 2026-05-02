'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const slugify = require('../utils/slugify');
const auditLog = require('../utils/auditLogger');

const router = Router();

// POST /api/business/auth/signup
router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('companyname').notEmpty().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, companyname, industry, website, location } = req.body;

      const existing = await pool.query('SELECT id FROM businesses WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      const slug = await slugify(companyname, 'businesses');
      const passwordhash = await bcrypt.hash(password, 12);

      const { rows } = await pool.query(
        `INSERT INTO businesses (email, passwordhash, companyname, slug, industry, website, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, companyname, slug, bio, logourl, industry, website, location, isemailverified, createdat`,
        [email, passwordhash, companyname, slug, industry || null, website || null, location || null]
      );

      const business = rows[0];
      const token = signToken({ id: business.id, type: 'business' });
      auditLog({ actorType: 'business', actorId: business.id, action: 'BUSINESS_SIGNUP', ipAddress: req.ip });

      return res.status(201).json({ token, business });
    } catch (err) {
      return res.status(500).json({ error: 'Signup failed', detail: err.message });
    }
  }
);

// POST /api/business/auth/login
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

      const { rows } = await pool.query(
        `SELECT id, email, passwordhash, companyname, slug, bio, logourl,
                industry, website, location, issuspended, isemailverified, createdat
         FROM businesses WHERE email = $1`,
        [email]
      );

      if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

      const business = rows[0];
      const valid = await bcrypt.compare(password, business.passwordhash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      if (business.issuspended) return res.status(403).json({ error: 'Account suspended' });

      await pool.query('UPDATE businesses SET lastlogin = NOW() WHERE id = $1', [business.id]);

      const token = signToken({ id: business.id, type: 'business' });
      auditLog({ actorType: 'business', actorId: business.id, action: 'BUSINESS_LOGIN', ipAddress: req.ip });

      const { passwordhash: _p, ...safeData } = business;
      return res.json({ token, business: safeData });
    } catch (err) {
      return res.status(500).json({ error: 'Login failed', detail: err.message });
    }
  }
);

// GET /api/business/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.actor.type !== 'business') {
      return res.status(403).json({ error: 'Business token required' });
    }
    const { rows } = await pool.query(
      `SELECT id, email, companyname, slug, bio, logourl, industry, website,
              location, issuspended, isemailverified, createdat
       FROM businesses WHERE id = $1`,
      [req.actor.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Business not found' });
    return res.json({ business: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile', detail: err.message });
  }
});

// GET /api/business/content
router.get('/content', requireAuth, async (req, res) => {
  try {
    if (req.actor.type !== 'business') {
      return res.status(403).json({ error: 'Business token required' });
    }
    const { rows } = await pool.query(
      `SELECT id, title, body, mediaurl, budgetrange, targetsport, status, createdat, updatedat
       FROM business_content WHERE businessid = $1 ORDER BY createdat DESC`,
      [req.actor.id]
    );
    return res.json({ content: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch content', detail: err.message });
  }
});

// POST /api/business/content
router.post(
  '/content',
  requireAuth,
  [body('title').notEmpty().trim()],
  validate,
  async (req, res) => {
    try {
      if (req.actor.type !== 'business') {
        return res.status(403).json({ error: 'Business token required' });
      }
      const { title, body: bodyText, mediaurl, budgetrange, targetsport } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO business_content (businessid, title, body, mediaurl, budgetrange, targetsport)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.actor.id, title, bodyText || null, mediaurl || null, budgetrange || null, targetsport || null]
      );
      await pool.query(
        `INSERT INTO moderation_queue (contenttype, contentid) VALUES ('business_content', $1)`,
        [rows[0].id]
      );
      auditLog({ actorType: 'business', actorId: req.actor.id, action: 'BUSINESS_CONTENT_CREATE', targetType: 'business_content', targetId: rows[0].id });
      return res.status(201).json({ content: rows[0] });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create content', detail: err.message });
    }
  }
);

// PATCH /api/business/content/:id
router.patch('/content/:id', requireAuth, async (req, res) => {
  try {
    if (req.actor.type !== 'business') {
      return res.status(403).json({ error: 'Business token required' });
    }
    const { id } = req.params;
    const { title, body: bodyText, mediaurl, budgetrange, targetsport } = req.body;
    const { rows } = await pool.query(
      `UPDATE business_content
       SET title = COALESCE($1, title),
           body = COALESCE($2, body),
           mediaurl = COALESCE($3, mediaurl),
           budgetrange = COALESCE($4, budgetrange),
           targetsport = COALESCE($5, targetsport),
           updatedat = NOW()
       WHERE id = $6 AND businessid = $7
       RETURNING *`,
      [title || null, bodyText || null, mediaurl || null, budgetrange || null, targetsport || null, id, req.actor.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Content not found' });
    return res.json({ content: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update content', detail: err.message });
  }
});

// DELETE /api/business/content/:id
router.delete('/content/:id', requireAuth, async (req, res) => {
  try {
    if (req.actor.type !== 'business') {
      return res.status(403).json({ error: 'Business token required' });
    }
    const { rows } = await pool.query(
      `UPDATE business_content SET status = 'deleted', updatedat = NOW()
       WHERE id = $1 AND businessid = $2 RETURNING id`,
      [req.params.id, req.actor.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Content not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete content', detail: err.message });
  }
});

module.exports = router;
