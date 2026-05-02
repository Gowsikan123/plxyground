'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = express.Router();
router.use(requireAdmin);

// ─── UNIFIED USER LIST ────────────────────────────────────────────────────────
// GET /api/admin/users?search=&page=&limit=
// Returns creators + businesses in a single merged list for the admin panel.
router.get('/', async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : null;

    // Creators
    const creatorsQ = search
      ? await pool.query(
          `SELECT c.id, c.username AS name, ca.email, 'creator' AS role,
                  ca.is_suspended, ca.is_email_verified AS email_verified, c.created_at
           FROM creators c
           JOIN creator_accounts ca ON c.id = ca.creator_id
           WHERE c.username ILIKE $1 OR c.display_name ILIKE $1 OR ca.email ILIKE $1
           ORDER BY c.created_at DESC LIMIT 200`,
          [search]
        )
      : await pool.query(
          `SELECT c.id, c.username AS name, ca.email, 'creator' AS role,
                  ca.is_suspended, ca.is_email_verified AS email_verified, c.created_at
           FROM creators c
           JOIN creator_accounts ca ON c.id = ca.creator_id
           ORDER BY c.created_at DESC LIMIT 200`
        );

    // Businesses
    const businessQ = search
      ? await pool.query(
          `SELECT id, company_name AS name, email, 'business' AS role,
                  is_suspended, is_email_verified AS email_verified, created_at
           FROM businesses
           WHERE company_name ILIKE $1 OR email ILIKE $1
           ORDER BY created_at DESC LIMIT 200`,
          [search]
        )
      : await pool.query(
          `SELECT id, company_name AS name, email, 'business' AS role,
                  is_suspended, is_email_verified AS email_verified, created_at
           FROM businesses
           ORDER BY created_at DESC LIMIT 200`
        );

    const merged = [
      ...creatorsQ.rows,
      ...businessQ.rows,
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ data: merged });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── CREATORS ─────────────────────────────────────────────────────────────────
router.get('/creators', async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || '1',  10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;
    const search = req.query.search || null;
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE (c.username ILIKE $1 OR c.display_name ILIKE $1 OR ca.email ILIKE $1)`;
    }
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM creators c JOIN creator_accounts ca ON c.id=ca.creator_id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);
    params.push(limit, offset);
    const idx = params.length;
    const result = await pool.query(
      `SELECT c.id, c.username, c.display_name, c.sport, c.location, c.is_verified,
              c.follower_count, c.created_at, ca.email, ca.is_suspended, ca.last_login,
              ca.is_email_verified
       FROM creators c JOIN creator_accounts ca ON c.id=ca.creator_id
       ${where} ORDER BY c.created_at DESC LIMIT $${idx - 1} OFFSET $${idx}`,
      params
    );
    return res.json({ data: result.rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

router.get('/businesses', async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || '1',  10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;
    const countRes = await pool.query('SELECT COUNT(*) FROM businesses');
    const result  = await pool.query(
      'SELECT id, email, company_name, slug, industry, location, is_suspended, is_email_verified, last_login, created_at FROM businesses ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return res.json({ data: result.rows, meta: { page, limit, total: parseInt(countRes.rows[0].count, 10) } });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// ─── SUSPEND ──────────────────────────────────────────────────────────────────
router.post('/creators/:id/suspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const reason = req.body.reason || null;
    await pool.query('UPDATE creator_accounts SET is_suspended=true WHERE creator_id=$1', [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'SUSPEND_CREATOR', target_type: 'creator', target_id: id, metadata: { reason }, ip_address: req.ip });
    return res.json({ message: 'Creator suspended' });
  } catch {
    return res.status(500).json({ error: 'Suspend failed' });
  }
});

router.post('/businesses/:id/suspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const reason = req.body.reason || null;
    await pool.query('UPDATE businesses SET is_suspended=true WHERE id=$1', [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'SUSPEND_BUSINESS', target_type: 'business', target_id: id, metadata: { reason }, ip_address: req.ip });
    return res.json({ message: 'Business suspended' });
  } catch {
    return res.status(500).json({ error: 'Suspend failed' });
  }
});

// ─── UNSUSPEND / REACTIVATE ───────────────────────────────────────────────────
router.post('/creators/:id/unsuspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('UPDATE creator_accounts SET is_suspended=false WHERE creator_id=$1', [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'UNSUSPEND_CREATOR', target_type: 'creator', target_id: id, ip_address: req.ip });
    return res.json({ message: 'Creator unsuspended' });
  } catch {
    return res.status(500).json({ error: 'Unsuspend failed' });
  }
});

router.post('/businesses/:id/unsuspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('UPDATE businesses SET is_suspended=false WHERE id=$1', [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'UNSUSPEND_BUSINESS', target_type: 'business', target_id: id, ip_address: req.ip });
    return res.json({ message: 'Business unsuspended' });
  } catch {
    return res.status(500).json({ error: 'Unsuspend failed' });
  }
});

// Generic reactivate — used by admin panel unified users list.
// Expects { role: 'creator'|'business' } in body OR detects from DB.
router.post('/:id/reactivate', async (req, res) => {
  try {
    const id   = parseInt(req.params.id, 10);
    const role = req.body.role;
    if (role === 'creator') {
      await pool.query('UPDATE creator_accounts SET is_suspended=false WHERE creator_id=$1', [id]);
    } else if (role === 'business') {
      await pool.query('UPDATE businesses SET is_suspended=false WHERE id=$1', [id]);
    } else {
      // Try both, whichever hits
      await pool.query('UPDATE creator_accounts SET is_suspended=false WHERE creator_id=$1', [id]);
      await pool.query('UPDATE businesses SET is_suspended=false WHERE id=$1', [id]);
    }
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'REACTIVATE_USER', target_id: id, ip_address: req.ip });
    return res.json({ message: 'User reactivated' });
  } catch {
    return res.status(500).json({ error: 'Reactivate failed' });
  }
});

// ─── EMAIL VERIFY ─────────────────────────────────────────────────────────────
router.put('/:id/verify-email', async (req, res) => {
  try {
    const id   = parseInt(req.params.id, 10);
    const role = req.body.role;
    if (role === 'creator') {
      await pool.query('UPDATE creator_accounts SET is_email_verified=true WHERE creator_id=$1', [id]);
    } else if (role === 'business') {
      await pool.query('UPDATE businesses SET is_email_verified=true WHERE id=$1', [id]);
    } else {
      await pool.query('UPDATE creator_accounts SET is_email_verified=true WHERE creator_id=$1', [id]);
      await pool.query('UPDATE businesses SET is_email_verified=true WHERE id=$1', [id]);
    }
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'VERIFY_EMAIL', target_id: id, ip_address: req.ip });
    return res.json({ message: 'Email verified' });
  } catch {
    return res.status(500).json({ error: 'Verify failed' });
  }
});

// Alias — admin panel calls verifyEmail(id) which sends PUT /:id/email-verify
router.put('/:id/email-verify', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('UPDATE creator_accounts SET is_email_verified=true WHERE creator_id=$1', [id]);
    await pool.query('UPDATE businesses SET is_email_verified=true WHERE id=$1', [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'VERIFY_EMAIL', target_id: id, ip_address: req.ip });
    return res.json({ message: 'Email verified' });
  } catch {
    return res.status(500).json({ error: 'Verify failed' });
  }
});

// ─── ADMIN-INITIATED PASSWORD RESET ─────────────────────────────────────────
// POST /api/admin/users/reset-password  { email }
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    // Generate a random 12-char temp password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    let temp = '';
    for (let i = 0; i < 12; i++) temp += chars[Math.floor(Math.random() * chars.length)];
    const hash = await bcrypt.hash(temp, 12);
    // Try creator_accounts first, then businesses
    const ca = await pool.query(
      `UPDATE creator_accounts SET password_hash=$1 WHERE creator_id=(
         SELECT id FROM creators WHERE id=(
           SELECT creator_id FROM creator_accounts WHERE email=$2 LIMIT 1
         ) LIMIT 1
       ) RETURNING creator_id`,
      [hash, email]
    );
    if (!ca.rowCount) {
      const biz = await pool.query(
        'UPDATE businesses SET password_hash=$1 WHERE email=$2 RETURNING id',
        [hash, email]
      );
      if (!biz.rowCount) return res.status(404).json({ error: 'No user found with that email' });
    }
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_RESET_PASSWORD', metadata: { email }, ip_address: req.ip });
    // Return the temp password so the admin can communicate it to the user.
    return res.json({ message: 'Password reset', tempPassword: temp });
  } catch {
    return res.status(500).json({ error: 'Reset failed' });
  }
});

module.exports = router;
