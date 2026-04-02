const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/setup');

const { verifyToken } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');
const router = express.Router();

// POST /api/auth/signup
router.post('/signup', requireFields(['name','email','password']), async (req, res) => {
  const { name, email, password, profile_slug, bio, location } = req.body;
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

  const refreshToken = jwt.sign(
    { id: account.creator_id, email, role: account.role },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`INSERT INTO refresh_tokens (creator_id, token, expires_at) VALUES (?, ?, ?)`)
    .run(account.creator_id, refreshToken, expiresAt);

  const accessToken = jwt.sign(
    { id: account.creator_id, email, role: account.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token: accessToken,
    refreshToken,
    user: {
      id: account.creator_id,
      name: account.name,
      email,
      role: account.role,
      profile_slug: account.profile_slug
    }
  });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  const creator = db.prepare(`SELECT c.*, ca.email FROM creators c JOIN creator_accounts ca ON ca.creator_id = c.id WHERE c.id = ?`).get(req.user.id);
  if (!creator) return res.status(404).json({ error: 'User not found' });
  res.json({ user: creator });
});

// GET /api/auth/me/export
router.get('/me/export', verifyToken, (req, res) => {
  const user = db.prepare(`SELECT c.*, ca.email FROM creators c JOIN creator_accounts ca ON ca.creator_id = c.id WHERE c.id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const content = db.prepare('SELECT * FROM content WHERE creator_id = ?').all(req.user.id);
  const opportunities = db.prepare('SELECT * FROM opportunities WHERE creator_id = ?').all(req.user.id);
  const applications = db.prepare('SELECT * FROM opportunity_applications WHERE creator_id = ?').all(req.user.id);

  res.json({ user, content, opportunities, applications });
});

// DELETE /api/auth/me
router.delete('/me', verifyToken, (req, res) => {
  const owner = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.user.id);
  if (!owner) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE creator_accounts SET is_suspended = 1 WHERE creator_id = ?').run(req.user.id);
  db.prepare('UPDATE creators SET is_active = 0 WHERE id = ?').run(req.user.id);

  db.prepare('INSERT INTO audit_log (action_type, actor, target, metadata) VALUES (?, ?, ?, ?)')
    .run('data_deletion', req.user.email || req.user.id, `user:${req.user.id}`, JSON.stringify({ reason: 'user requested deletion' }));

  res.json({ message: 'Account marked for deletion; data suspension complete.' });
});

// POST /api/auth/logout
router.post('/logout', verifyToken, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?').run(refreshToken);
  }
  res.json({ message: 'Logged out' });
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

  const tokenRow = db.prepare('SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0').get(refreshToken);
  if (!tokenRow) return res.status(401).json({ error: 'Invalid or revoked refresh token' });

  if (new Date(tokenRow.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Refresh token expired' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token: accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/2fa/request
router.post('/2fa/request', verifyToken, (req, res) => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO two_factor_codes (creator_id, code, expires_at) VALUES (?, ?, ?)')
    .run(req.user.id, code, expiresAt);

  // in real world send via SMS/email
  console.log(`2FA code for user ${req.user.id} is ${code}`);

  res.json({ message: '2FA code generated and sent' });
});

// POST /api/auth/2fa/verify
router.post('/2fa/verify', verifyToken, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });

  const record = db.prepare('SELECT * FROM two_factor_codes WHERE creator_id = ? AND code = ? AND is_used = 0').get(req.user.id, code);
  if (!record || new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  db.prepare('UPDATE two_factor_codes SET is_used = 1 WHERE id = ?').run(record.id);
  res.json({ message: '2FA verified' });
});

module.exports = router;
