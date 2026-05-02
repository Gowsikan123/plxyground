'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body } = require('express-validator');
const pool = require('../db/client');
const { signToken } = require('../utils/jwt');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/auth');
const { generateUniqueSlug } = require('../utils/slugify');
const audit = require('../utils/auditLogger');
const { sendPasswordReset } = require('../utils/mailer');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/signup',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('username').matches(/^[a-zA-Z0-9_]{3,30}$/).withMessage('Username must be 3-30 alphanumeric characters'),
    body('display_name').trim().isLength({ min: 2, max: 60 }).withMessage('Display name required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, username, display_name, bio, sport, location } = req.body;
      const exists = await pool.query(
        'SELECT id FROM creator_accounts WHERE email=$1 UNION SELECT id FROM creators WHERE username=$2 LIMIT 1',
        [email, username]
      );
      if (exists.rows.length) return res.status(409).json({ error: 'Email or username already in use' });
      const slug = await generateUniqueSlug(username, 'creators');
      const hash = await bcrypt.hash(password, 12);
      const creatorRes = await pool.query(
        'INSERT INTO creators (username, slug, display_name, bio, sport, location) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
        [username, slug, display_name, bio || null, sport || null, location || null]
      );
      const creatorId = creatorRes.rows[0].id;
      const accountRes = await pool.query(
        'INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES ($1,$2,$3) RETURNING id',
        [creatorId, email, hash]
      );
      const accountId = accountRes.rows[0].id;
      const token = signToken({ sub: accountId, type: 'creator', creator_id: creatorId });
      await audit.log({ actor_type: 'creator', actor_id: creatorId, action: 'SIGNUP', ip_address: req.ip });
      return res.status(201).json({
        token,
        user: { id: accountId, creator_id: creatorId, email, username, slug, display_name, bio: bio || null, sport: sport || null, location: location || null, avatar_url: null, is_verified: false, follower_count: 0, type: 'creator' },
      });
    } catch {
      return res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

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
      const result = await pool.query(
        `SELECT ca.*, c.id AS creator_id, c.username, c.slug, c.display_name, c.bio,
                c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified
         FROM creator_accounts ca JOIN creators c ON ca.creator_id=c.id
         WHERE ca.email=$1`,
        [email]
      );
      if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const account = result.rows[0];
      if (account.is_suspended) return res.status(403).json({ error: 'Account suspended' });
      const valid = await bcrypt.compare(password, account.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      await pool.query('UPDATE creator_accounts SET last_login=NOW() WHERE id=$1', [account.id]);
      const token = signToken({ sub: account.id, type: 'creator', creator_id: account.creator_id });
      await audit.log({ actor_type: 'creator', actor_id: account.creator_id, action: 'LOGIN', ip_address: req.ip });
      return res.json({
        token,
        user: {
          id: account.id, creator_id: account.creator_id, email: account.email,
          username: account.username, slug: account.slug, display_name: account.display_name,
          bio: account.bio, avatar_url: account.avatar_url, sport: account.sport,
          location: account.location, follower_count: account.follower_count,
          is_verified: account.is_verified, type: 'creator',
        },
      });
    } catch {
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  try {
    const u = req.user;
    return res.json({
      id: u.id, creator_id: u.creator_id, email: u.email, username: u.username,
      slug: u.slug, display_name: u.display_name, bio: u.bio, avatar_url: u.avatar_url,
      sport: u.sport, location: u.location, follower_count: u.follower_count,
      is_verified: u.is_verified, type: 'creator',
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch(
  '/profile',
  requireAuth,
  [
    body('display_name').optional().trim().isLength({ min: 2, max: 60 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('sport').optional().trim().isLength({ max: 60 }),
    body('location').optional().trim().isLength({ max: 100 }),
    body('avatar_url').optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      const { display_name, bio, sport, location, avatar_url } = req.body;
      const result = await pool.query(
        `UPDATE creators SET
           display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           sport = COALESCE($3, sport),
           location = COALESCE($4, location),
           avatar_url = COALESCE($5, avatar_url)
         WHERE id=$6 RETURNING *`,
        [display_name || null, bio || null, sport || null, location || null, avatar_url || null, req.user.creator_id]
      );
      return res.json(result.rows[0]);
    } catch {
      return res.status(500).json({ error: 'Profile update failed' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET FLOW
//
// Step 1 — POST /api/auth/forgot-password
//   User submits their email. We generate a secure random token, hash it
//   (so the raw token is never stored), save the hash + 1hr expiry to the DB,
//   then email the raw token as part of a link.
//   Always returns 200 regardless of whether the email exists — this prevents
//   attackers from using this endpoint to discover registered email addresses.
//
// Step 2 — POST /api/auth/reset-password
//   User submits the raw token from the email + their new password.
//   We hash the token, look it up in the DB, check it hasn't expired,
//   update the password, and clear the token so it can't be reused.
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  validate,
  async (req, res) => {
    // Always respond 200 — never reveal whether the email is registered
    const successResponse = () => res.json({
      message: 'If that email is registered, a reset link has been sent.'
    });

    try {
      const { email } = req.body;
      const { rows } = await pool.query(
        'SELECT id FROM creator_accounts WHERE email = $1 LIMIT 1',
        [email]
      );

      // Email not found — return success anyway (anti-enumeration)
      if (!rows.length) return successResponse();

      const accountId = rows[0].id;

      // Generate a cryptographically secure 32-byte random token
      const rawToken = crypto.randomBytes(32).toString('hex'); // 64 hex chars

      // Hash it before storing — if the DB is ever leaked, tokens are useless
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Store hash + expiry (1 hour from now)
      await pool.query(
        `UPDATE creator_accounts
         SET reset_token_hash = $1, reset_token_expires_at = NOW() + INTERVAL '1 hour'
         WHERE id = $2`,
        [tokenHash, accountId]
      );

      // Send the raw token in the email link
      await sendPasswordReset(email, rawToken);

      await audit.log({
        actor_type: 'creator', actor_id: accountId,
        action: 'PASSWORD_RESET_REQUESTED', ip_address: req.ip,
      });

      return successResponse();
    } catch (err) {
      // Still return 200 — don't leak server errors to potential attackers
      console.error('forgot-password error:', err.message);
      return successResponse();
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Token required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // Hash the incoming raw token to compare against the stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const { rows } = await pool.query(
        `SELECT id FROM creator_accounts
         WHERE reset_token_hash = $1
           AND reset_token_expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
      );

      if (!rows.length) {
        return res.status(400).json({ error: 'Reset token is invalid or has expired.' });
      }

      const accountId = rows[0].id;
      const newHash = await bcrypt.hash(password, 12);

      // Update password and clear the reset token so it can't be reused
      await pool.query(
        `UPDATE creator_accounts
         SET password_hash = $1,
             reset_token_hash = NULL,
             reset_token_expires_at = NULL
         WHERE id = $2`,
        [newHash, accountId]
      );

      await audit.log({
        actor_type: 'creator', actor_id: accountId,
        action: 'PASSWORD_RESET_COMPLETED', ip_address: req.ip,
      });

      return res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      console.error('reset-password error:', err.message);
      return res.status(500).json({ error: 'Password reset failed.' });
    }
  }
);

module.exports = router;
