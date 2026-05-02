'use strict';

const express = require('express');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const auditLogger = require('../../utils/auditLogger');

const router = express.Router();

router.get('/creators', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { search, limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = parseInt(offset, 10) || 0;
  try {
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE (cr.username ILIKE $1 OR cr.display_name ILIKE $1 OR ca.email ILIKE $1)`;
    }
    params.push(safeLimit);
    params.push(safeOffset);
    const idx = params.length;
    const { rows } = await pool.query(
      `SELECT cr.id, cr.username, cr.display_name, cr.sport, cr.avatar_url, cr.is_verified, cr.created_at,
              ca.email, ca.is_suspended, ca.last_login
       FROM creators cr
       LEFT JOIN creator_accounts ca ON ca.creator_id = cr.id
       ${where}
       ORDER BY cr.created_at DESC
       LIMIT $${idx - 1} OFFSET $${idx}`,
      params
    );
    return res.json({ data: rows });
  } catch (err) {
    throw err;
  }
});

router.get('/businesses', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { search, limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = parseInt(offset, 10) || 0;
  try {
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE (company_name ILIKE $1 OR email ILIKE $1)`;
    }
    params.push(safeLimit);
    params.push(safeOffset);
    const idx = params.length;
    const { rows } = await pool.query(
      `SELECT id, company_name, slug, industry, logo_url, email, is_suspended, last_login, created_at FROM businesses ${where} ORDER BY created_at DESC LIMIT $${idx - 1} OFFSET $${idx}`,
      params
    );
    return res.json({ data: rows });
  } catch (err) {
    throw err;
  }
});

router.post('/creators/:id/suspend', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query(`UPDATE creator_accounts SET is_suspended = true WHERE creator_id = $1`, [id]);
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'CREATOR_SUSPENDED', target_type: 'creator', target_id: parseInt(id, 10), ip_address: req.ip, meta: { reason } });
    return res.json({ success: true });
  } catch (err) {
    throw err;
  }
});

router.post('/creators/:id/reactivate', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  try {
    await pool.query(`UPDATE creator_accounts SET is_suspended = false WHERE creator_id = $1`, [id]);
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'CREATOR_REACTIVATED', target_type: 'creator', target_id: parseInt(id, 10), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    throw err;
  }
});

router.post('/businesses/:id/suspend', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query(`UPDATE businesses SET is_suspended = true WHERE id = $1`, [id]);
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'BUSINESS_SUSPENDED', target_type: 'business', target_id: parseInt(id, 10), ip_address: req.ip, meta: { reason } });
    return res.json({ success: true });
  } catch (err) {
    throw err;
  }
});

router.post('/businesses/:id/reactivate', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  try {
    await pool.query(`UPDATE businesses SET is_suspended = false WHERE id = $1`, [id]);
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'BUSINESS_REACTIVATED', target_type: 'business', target_id: parseInt(id, 10), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    throw err;
  }
});

router.post('/creators/:id/verify', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  try {
    await pool.query(`UPDATE creators SET is_verified = true WHERE id = $1`, [id]);
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'CREATOR_VERIFIED', target_type: 'creator', target_id: parseInt(id, 10), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
