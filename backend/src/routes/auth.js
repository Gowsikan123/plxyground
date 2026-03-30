const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/setup');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, profile_slug, bio, location } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const slug = profile_slug || name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

  try {
    const hash = await bcrypt.hash(password, 10);
    const creator = db.prepare(
      `INSERT INTO creators (name, role, bio, location, profile_slug) VALUES (?, 'CREATOR', ?, ?, ?)`
    ).run(name, bio || null, location || null, slug);

    db.prepare(
      `INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)`
    ).run(creator.lastInsertRowid, email, hash);

    const token = jwt.sign(
      { id: creator.lastInsertRowid, email, role: 'CREATOR' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: creator.lastInsertRowid,
        name,
        email,
        role: 'CREATOR',
        profile_slug: slug
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email or slug already taken' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const account = db.prepare(`
    SELECT ca.*, c.name, c.role, c.profile_slug
    FROM creator_accounts ca
    JOIN creators c ON c.id = ca.creator_id
    WHERE ca.email = ?
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