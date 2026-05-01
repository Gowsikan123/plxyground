const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/setup');

const { requireFields } = require('../middleware/validate');
const router = express.Router();

// POST /api/business/auth/signup
router.post('/auth/signup', requireFields(['organizationName','email','password']), async (req, res) => {
  const { organizationName, email, password, bio, location } = req.body;
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const slug = organizationName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

  try {
    const hash = await bcrypt.hash(password, 10);
    const creator = await db.prepare(
      `INSERT INTO creators (name, role, bio, location, profile_slug) VALUES (?, 'BUSINESS', ?, ?, ?)`
    ).run(organizationName, bio || null, location || null, slug);

    await db.prepare(
      `INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)`
    ).run(creator.lastInsertRowid, email, hash);

    const token = jwt.sign(
      { id: creator.lastInsertRowid, email, role: 'BUSINESS' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: creator.lastInsertRowid,
        name: organizationName,
        email,
        role: 'BUSINESS',
        profile_slug: slug
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/business/auth/login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const account = await db.prepare(`
    SELECT ca.*, c.name, c.role, c.profile_slug
    FROM creator_accounts ca
    JOIN creators c ON c.id = ca.creator_id
    WHERE ca.email = ? AND c.role = 'BUSINESS'
  `).get(email);

  if (!account) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (account.is_suspended) {
    return res.status(403).json({
      error: 'Your account has been suspended.',
      code: 'ACCOUNT_SUSPENDED'
    });
  }

  const valid = await bcrypt.compare(password, account.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: account.creator_id, email, role: account.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: {
      id: account.creator_id,
      name: account.name,
      email,
      role: account.role,
      profile_slug: account.profile_slug
    }
  });
});

module.exports = router;
