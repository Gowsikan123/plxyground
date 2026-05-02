'use strict';
// NOTE: This is a legacy route file kept for backward compatibility.
// New business auth should use businessAuth.js instead.
// This file has been refactored to use shared project utilities:
//   - signToken()        from utils/jwt.js       (was: raw jsonwebtoken)
//   - generateUniqueSlug() from utils/slugify.js  (was: inline slug logic)
//   - pool.query()       from db/client.js        (was: db.prepare().run() — SQLite API)

const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { generateUniqueSlug } = require('../utils/slugify');

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

  try {
    // Check for existing email
    const existing = await pool.query(
      'SELECT id FROM creator_accounts WHERE email = $1 LIMIT 1',
      [email]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email already taken' });
    }

    const slug = await generateUniqueSlug(organizationName, 'creators');
    const hash = await bcrypt.hash(password, 12);

    const creatorRes = await pool.query(
      'INSERT INTO creators (username, slug, display_name, bio, location) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [slug, slug, organizationName, bio || null, location || null]
    );
    const creatorId = creatorRes.rows[0].id;

    const accountRes = await pool.query(
      'INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [creatorId, email, hash]
    );
    const accountId = accountRes.rows[0].id;

    const token = signToken({ sub: accountId, type: 'business', creator_id: creatorId });

    return res.status(201).json({
      token,
      user: { id: accountId, creator_id: creatorId, name: organizationName, email, role: 'BUSINESS', profile_slug: slug },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already taken' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/business/auth/login (legacy — prefer businessAuth.js)
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await pool.query(
      `SELECT ca.*, c.id AS creator_id, c.display_name AS name, c.slug AS profile_slug
       FROM creator_accounts ca
       JOIN creators c ON c.id = ca.creator_id
       WHERE ca.email = $1`,
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const account = result.rows[0];

    if (account.is_suspended) {
      return res.status(403).json({ error: 'Your account has been suspended.', code: 'ACCOUNT_SUSPENDED' });
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query('UPDATE creator_accounts SET last_login = NOW() WHERE id = $1', [account.id]);

    const token = signToken({ sub: account.id, type: 'business', creator_id: account.creator_id });

    return res.json({
      token,
      user: { id: account.id, creator_id: account.creator_id, name: account.name, email, role: 'BUSINESS', profile_slug: account.profile_slug },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
