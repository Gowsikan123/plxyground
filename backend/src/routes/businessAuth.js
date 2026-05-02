'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../db/client');
const { signToken } = require('../utils/jwt');
const slugify = require('../utils/slugify');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/business/auth/signup
router.post('/signup', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('company_name').trim().isLength({ min: 2, max: 80 }),
], validate, async (req, res) => {
  try {
    const { email, password, company_name, industry, website, location } = req.body;
    const slug = slugify(company_name);
    const hash = await bcrypt.hash(password, 12);
    await db.prepare(
      `INSERT INTO businesses (email, password_hash, company_name, slug, industry, website, location) VALUES ($1, $2, $3, $4, $5, $6, $7)`
    ).run(email, hash, company_name, slug, industry || null, website || null, location || null);
    const biz = await db.prepare('SELECT * FROM businesses WHERE email = $1').get(email);
    const token = signToken({ sub: biz.id, type: 'business' });
    return res.status(201).json({ success: true, data: { token, user: biz } });
  } catch (err) {
    if (err.code === '23505' || (err.message && (err.message.includes('UNIQUE') || err.message.includes('unique')))) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/business/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const biz = await db.prepare('SELECT * FROM businesses WHERE email = $1').get(email);
    if (!biz) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (biz.is_suspended) return res.status(403).json({ success: false, error: 'Account suspended' });
    const match = await bcrypt.compare(password, biz.password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    await db.prepare('UPDATE businesses SET last_login = NOW() WHERE id = $1').run(biz.id);
    const token = signToken({ sub: biz.id, type: 'business' });
    const { password_hash, ...safeBiz } = biz;
    return res.json({ success: true, data: { token, user: safeBiz } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/business/auth/me
router.get('/me', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Forbidden' });
  const biz = await db.prepare('SELECT id, email, company_name, slug, bio, logo_url, industry, website, location, is_suspended, is_email_verified, last_login, created_at FROM businesses WHERE id = $1').get(req.user.sub);
  if (!biz) return res.status(404).json({ success: false, error: 'Not found' });
  return res.json({ success: true, data: biz });
});

module.exports = router;
