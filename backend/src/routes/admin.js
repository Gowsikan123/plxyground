'use strict';
const express = require('express');
const pool = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const auditLogger = require('../utils/auditLogger');
const logger = require('../logger');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (_req, res) => {
  try {
    const [creators, businesses, content, opps, queue] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS cnt FROM creators'),
      pool.query('SELECT COUNT(*)::int AS cnt FROM businesses'),
      pool.query("SELECT COUNT(*)::int AS cnt FROM content WHERE status = 'published'"),
      pool.query("SELECT COUNT(*)::int AS cnt FROM opportunities WHERE status = 'published'"),
      pool.query("SELECT COUNT(*)::int AS cnt FROM moderation_queue WHERE status = 'pending'"),
    ]);
    return res.json({
      creators: creators.rows[0].cnt,
      businesses: businesses.rows[0].cnt,
      published_content: content.rows[0].cnt,
      published_opportunities: opps.rows[0].cnt,
      pending_moderation: queue.rows[0].cnt,
    });
  } catch (err) {
    logger.error('GET /api/admin/stats', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

router.get('/moderation', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    const { rows } = await pool.query(
      "SELECT * FROM moderation_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1 OFFSET $2",
      [lim, off]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/moderation', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch moderation queue.' });
  }
});

router.post('/moderation/:id/approve', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM moderation_queue WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found.' });
    const item = rows[0];
    const table = item.content_type === 'business_content' ? 'business_content' : 'content';
    await pool.query("UPDATE moderation_queue SET status = 'approved', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2", [req.user.id, req.params.id]);
    await pool.query("UPDATE " + table + " SET status = 'published' WHERE id = $1", [item.content_id]);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'MODERATION_APPROVED', target_type: item.content_type, target_id: item.content_id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/moderation/:id/approve', { message: err.message });
    return res.status(500).json({ error: 'Failed to approve.' });
  }
});

router.post('/moderation/:id/reject', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM moderation_queue WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found.' });
    const item = rows[0];
    const table = item.content_type === 'business_content' ? 'business_content' : 'content';
    const reason = req.body.reason || null;
    await pool.query("UPDATE moderation_queue SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2 WHERE id = $3", [req.user.id, reason, req.params.id]);
    await pool.query("UPDATE " + table + " SET status = 'rejected' WHERE id = $1", [item.content_id]);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'MODERATION_REJECTED', target_type: item.content_type, target_id: item.content_id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/moderation/:id/reject', { message: err.message });
    return res.status(500).json({ error: 'Failed to reject.' });
  }
});

router.post('/users/:id/suspend', async (req, res) => {
  const { type } = req.body;
  try {
    if (type === 'creator') {
      await pool.query('UPDATE creator_accounts SET is_suspended = TRUE WHERE creator_id = $1', [req.params.id]);
    } else {
      await pool.query('UPDATE businesses SET is_suspended = TRUE WHERE id = $1', [req.params.id]);
    }
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'USER_SUSPENDED', target_type: type, target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/users/:id/suspend', { message: err.message });
    return res.status(500).json({ error: 'Failed to suspend user.' });
  }
});

router.post('/users/:id/verify', async (req, res) => {
  try {
    await pool.query('UPDATE creators SET is_verified = TRUE WHERE id = $1', [req.params.id]);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'CREATOR_VERIFIED', target_type: 'creator', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/users/:id/verify', { message: err.message });
    return res.status(500).json({ error: 'Failed to verify creator.' });
  }
});

router.get('/audit', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 50, 200);
    const off = parseInt(offset, 10) || 0;
    const { rows } = await pool.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [lim, off]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/audit', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

module.exports = router;
