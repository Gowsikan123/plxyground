const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/client');

const router = express.Router();

// POST /api/business/auth/signup (legacy — prefer businessAuth.js)
router.post('/auth/signup', async (req, res) => {
  const { organizationName, email, password, bio, location } = req.body;
  if (!organizationName || !email || !password) {
    return res.status(400).json({ error: 'organizationName, email and password required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const slug = organizationName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

  try {
    const hash = await bcrypt.hash(password, 10);
    const creator = await db.prepare(
      `INSERT INTO creators (username, slug, display_name, bio, location) VALUES ($1, $2, $3, $4, $5) RETURNING id`
    ).run(slug, slug, organizationName, bio || null, location || null);

    await db.prepare(
      `INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES ($1, $2, $3)`
    ).run(creator.lastInsertRowid, email, hash);

    const token = jwt.sign(
      { id: creator.lastInsertRowid, email, role: 'BUSINESS' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: { id: creator.lastInsertRowid, name: organizationName, email, role: 'BUSINESS', profile_slug: slug }
    });
  } catch (err) {
    if (err.code === '23505' || (err.message && (err.message.includes('UNIQUE') || err.message.includes('unique')))) {
      return res.status(409).json({ error: 'Email already taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/business/auth/login (legacy)
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const account = await db.prepare(`
      SELECT ca.*, c.display_name as name, c.slug as profile_slug
      FROM creator_accounts ca
      JOIN creators c ON c.id = ca.creator_id
      WHERE ca.email = $1
    `).get(email);

    if (!account) return res.status(401).json({ error: 'Invalid credentials' });
    if (account.is_suspended) return res.status(403).json({ error: 'Your account has been suspended.', code: 'ACCOUNT_SUSPENDED' });

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: account.creator_id, email, role: 'BUSINESS' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: account.creator_id, name: account.name, email, role: 'BUSINESS', profile_slug: account.profile_slug }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
