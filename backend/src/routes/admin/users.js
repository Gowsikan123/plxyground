'use strict';
const express = require('express');
const pool = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = express.Router();

router.use(requireAdmin);

router.get('/creators', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;
    const search = req.query.search || null;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (search) {
      conditions.push(`(c.username ILIKE $${idx} OR c.display_name ILIKE $${idx + 1} OR ca.email ILIKE $${idx + 2})`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      idx += 3;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await pool.query(`SELECT COUNT(*) FROM creators c JOIN creator_accounts ca ON c.id=ca.creator_id ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    params.push(limit, offset);
    const result = await pool.query(
      `SELECT c.id, c.username, c.display_name, c.sport, c.location, c.is_verified, c.follower_count, c.created_at,
              ca.email, ca.is_suspended, ca.last_login
       FROM creators c JOIN creator_accounts ca ON c.id=ca.creator_id
       ${where} ORDER BY c.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );
    return res.json({ data: result.rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

router.get('/businesses', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;
    const result = await pool.query(
      'SELECT id, email, company_name, slug, industry, location, is_suspended, is_email_verified, last_login, created_at FROM businesses ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countRes = await pool.query('SELECT COUNT(*) FROM businesses');
    return res.json({ data: result.rows, meta: { page, limit, total: parseInt(countRes.rows[0].count, 10) } });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

router.post('/creators/:id/suspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('UPDATE creator_accounts SET is_suspended=true WHERE creator_id=$1', [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'SUSPEND_CREATOR', target_type: 'creator', target_id: id, ip_address: req.ip });
    return res.json({ message: 'Creator suspended' });
  } catch {
    return res.status(500).json({ error: 'Suspend failed' });
  }
});

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

router.post('/businesses/:id/suspend', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('UPDATE businesses SET is_suspended=true WHERE id=$1', [id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'SUSPEND_BUSINESS', target_type: 'business', target_id: id, ip_address: req.ip });
    return res.json({ message: 'Business suspended' });
  } catch {
    return res.status(500).json({ error: 'Suspend failed' });
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

module.exports = router;
