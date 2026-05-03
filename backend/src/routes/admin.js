'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { signToken } = require('../utils/jwt');
const { authLimiter } = require('../middleware/rateLimiter');
const auditLogger = require('../utils/auditLogger');
const logger = require('../logger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// AUTH (no requireAuth — these are the login endpoints)
// Rate-limited to prevent brute-force attacks.
// ─────────────────────────────────────────────────────────────

// POST /api/admin/auth/login
router.post('/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials.' });
    const admin = rows[0];
    if (!admin.is_active) return res.status(403).json({ error: 'Account is inactive.' });
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    await pool.query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [admin.id]);
    const token = signToken({ sub: admin.id, type: 'admin', role: admin.role });
    return res.json({ token, user: { id: admin.id, email: admin.email, role: admin.role } });
  } catch (err) {
    logger.error('POST /api/admin/auth/login', { message: err.message });
    return res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/auth/change-password
router.post('/auth/change-password', authLimiter, requireAuth, requireAdmin, async (req, res) => {
  const { email, current_password, new_password } = req.body;
  if (!email || !current_password || !new_password) {
    return res.status(400).json({ error: 'email, current_password and new_password required.' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1 LIMIT 1',
      [email]
    );
    if (!rows.length) return res.status(404).json({ error: 'Admin not found.' });
    const admin = rows[0];
    const valid = await bcrypt.compare(current_password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, admin.id]);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'ADMIN_PASSWORD_CHANGED', target_type: 'admin', target_id: admin.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/auth/change-password', { message: err.message });
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────
// All routes below require a valid admin JWT.
// ─────────────────────────────────────────────────────────────
router.use(requireAuth, requireAdmin);

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────

// GET /api/admin/stats
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

// ─────────────────────────────────────────────────────────────
// MODERATION QUEUE
// The admin panel calls /queue — these are aliases for the panel
// that map to the underlying moderation_queue table.
// ─────────────────────────────────────────────────────────────

// GET /api/admin/moderation (original — kept for backward compat)
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

// GET /api/admin/queue  (called by admin panel)
// Returns a unified view: content + opportunity rows from moderation_queue
// with display-friendly columns (title_or_name, submitted_by).
router.get('/queue', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        mq.id,
        mq.content_type   AS type,
        mq.status,
        mq.created_at,
        COALESCE(c.title, o.title, bc.title) AS title_or_name,
        COALESCE(cr.display_name, b.organization_name, 'Unknown') AS submitted_by
      FROM moderation_queue mq
      LEFT JOIN content          c  ON mq.content_type = 'content'          AND mq.content_id = c.id
      LEFT JOIN business_content bc ON mq.content_type = 'business_content' AND mq.content_id = bc.id
      LEFT JOIN opportunities    o  ON mq.content_type = 'opportunity'      AND mq.content_id = o.id
      LEFT JOIN creators         cr ON c.creator_id = cr.id
      LEFT JOIN businesses       b  ON bc.business_id = b.id OR o.business_id = b.id
      WHERE mq.status = 'pending'
      ORDER BY mq.created_at DESC
    `);
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/queue', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch queue.' });
  }
});

// POST /api/admin/queue/bulk-action
// body: { action: 'approve' | 'reject' | 'delete', ids: [1,2,3] }
router.post('/queue/bulk-action', async (req, res) => {
  const { action, ids } = req.body;
  if (!action || !Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: 'action and ids[] required.' });
  }
  if (!['approve', 'reject', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'action must be approve, reject, or delete.' });
  }
  try {
    if (action === 'delete') {
      await pool.query('DELETE FROM moderation_queue WHERE id = ANY($1::int[])', [ids]);
    } else {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const { rows } = await pool.query(
        'SELECT * FROM moderation_queue WHERE id = ANY($1::int[])',
        [ids]
      );
      for (const item of rows) {
        const table = item.content_type === 'business_content' ? 'business_content'
                    : item.content_type === 'opportunity'      ? 'opportunities'
                    : 'content';
        const contentStatus = action === 'approve' ? 'published' : 'rejected';
        await pool.query(
          `UPDATE moderation_queue SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3`,
          [newStatus, req.user.id, item.id]
        );
        await pool.query(`UPDATE ${table} SET status = $1 WHERE id = $2`, [contentStatus, item.content_id]);
        await auditLogger.log({
          actor_type: 'admin', actor_id: req.user.id,
          action: action === 'approve' ? 'MODERATION_APPROVED' : 'MODERATION_REJECTED',
          target_type: item.content_type, target_id: item.content_id,
          ip_address: req.ip,
        });
      }
    }
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/queue/bulk-action', { message: err.message });
    return res.status(500).json({ error: 'Bulk action failed.' });
  }
});

// POST /api/admin/moderation/:id/approve (original — kept for backward compat)
router.post('/moderation/:id/approve', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM moderation_queue WHERE id = $1', [req.params.id]);
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

// POST /api/admin/moderation/:id/reject (original — kept for backward compat)
router.post('/moderation/:id/reject', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM moderation_queue WHERE id = $1', [req.params.id]);
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

// ─────────────────────────────────────────────────────────────
// CONTENT
// ─────────────────────────────────────────────────────────────

// GET /api/admin/content?search=&limit=
router.get('/content', async (req, res) => {
  try {
    const { search = '', limit = 50 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 50, 2000);
    const pattern = `%${search}%`;
    const { rows } = await pool.query(`
      SELECT c.*, cr.display_name AS creator_name
      FROM content c
      LEFT JOIN creators cr ON c.creator_id = cr.id
      WHERE c.title ILIKE $1 OR cr.display_name ILIKE $1
      ORDER BY c.created_at DESC
      LIMIT $2
    `, [pattern, lim]);
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/content', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

// PUT /api/admin/content/:id  — toggle publish status
router.put('/content/:id', async (req, res) => {
  try {
    const { is_published } = req.body;
    const status = is_published ? 'published' : 'pending';
    const { rows } = await pool.query(
      'UPDATE content SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: is_published ? 'CONTENT_PUBLISHED' : 'CONTENT_UNPUBLISHED', target_type: 'content', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('PUT /api/admin/content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update content.' });
  }
});

// DELETE /api/admin/content/:id
router.delete('/content/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM content WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'CONTENT_DELETED', target_type: 'content', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/admin/content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to delete content.' });
  }
});

// ─────────────────────────────────────────────────────────────
// OPPORTUNITIES
// ─────────────────────────────────────────────────────────────

// GET /api/admin/opportunities?search=&limit=
router.get('/opportunities', async (req, res) => {
  try {
    const { search = '', limit = 50 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 50, 2000);
    const pattern = `%${search}%`;
    const { rows } = await pool.query(`
      SELECT o.*, b.organization_name AS creator_name
      FROM opportunities o
      LEFT JOIN businesses b ON o.business_id = b.id
      WHERE o.title ILIKE $1 OR b.organization_name ILIKE $1
      ORDER BY o.created_at DESC
      LIMIT $2
    `, [pattern, lim]);
    const mapped = rows.map(r => ({ ...r, is_published: r.status === 'published' }));
    return res.json({ data: mapped });
  } catch (err) {
    logger.error('GET /api/admin/opportunities', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch opportunities.' });
  }
});

// PUT /api/admin/opportunities/:id
router.put('/opportunities/:id', async (req, res) => {
  try {
    const { is_published, moderation_status } = req.body;
    let status;
    if (moderation_status === 'rejected') {
      status = 'rejected';
    } else {
      status = is_published ? 'published' : 'pending';
    }
    const { rows } = await pool.query(
      'UPDATE opportunities SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'OPPORTUNITY_STATUS_CHANGED', target_type: 'opportunity', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('PUT /api/admin/opportunities/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update opportunity.' });
  }
});

// DELETE /api/admin/opportunities/:id
router.delete('/opportunities/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'OPPORTUNITY_DELETED', target_type: 'opportunity', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/admin/opportunities/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to delete opportunity.' });
  }
});

// ─────────────────────────────────────────────────────────────
// USERS
// Returns a unified list of creators + businesses for the panel.
// ─────────────────────────────────────────────────────────────

// GET /api/admin/users?search=
router.get('/users', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const pattern = `%${search}%`;
    const { rows } = await pool.query(`
      SELECT
        ca.id,
        cr.display_name  AS name,
        ca.email,
        'creator'        AS role,
        ca.is_suspended,
        ca.created_at
      FROM creator_accounts ca
      JOIN creators cr ON cr.id = ca.creator_id
      WHERE cr.display_name ILIKE $1 OR ca.email ILIKE $1

      UNION ALL

      SELECT
        b.id,
        b.organization_name AS name,
        b.email,
        'business'          AS role,
        b.is_suspended,
        b.created_at
      FROM businesses b
      WHERE b.organization_name ILIKE $1 OR b.email ILIKE $1

      ORDER BY created_at DESC
      LIMIT 500
    `, [pattern]);
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/users', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// POST /api/admin/users/:id/suspend
router.post('/users/:id/suspend', async (req, res) => {
  const { type, reason } = req.body;
  try {
    if (type === 'creator') {
      await pool.query('UPDATE creator_accounts SET is_suspended = TRUE WHERE creator_id = $1', [req.params.id]);
    } else {
      await pool.query('UPDATE businesses SET is_suspended = TRUE WHERE id = $1', [req.params.id]);
    }
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'USER_SUSPENDED', target_type: type || 'user', target_id: req.params.id, reason: reason || null, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/users/:id/suspend', { message: err.message });
    return res.status(500).json({ error: 'Failed to suspend user.' });
  }
});

// POST /api/admin/users/:id/reactivate
router.post('/users/:id/reactivate', async (req, res) => {
  const { type } = req.body;
  try {
    if (type === 'business') {
      await pool.query('UPDATE businesses SET is_suspended = FALSE WHERE id = $1', [req.params.id]);
    } else {
      await pool.query('UPDATE creator_accounts SET is_suspended = FALSE WHERE creator_id = $1', [req.params.id]);
    }
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'USER_REACTIVATED', target_type: type || 'user', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/users/:id/reactivate', { message: err.message });
    return res.status(500).json({ error: 'Failed to reactivate user.' });
  }
});

// PUT /api/admin/users/:id/email-verify
router.put('/users/:id/email-verify', async (req, res) => {
  try {
    await pool.query('UPDATE creator_accounts SET is_email_verified = TRUE WHERE creator_id = $1', [req.params.id]);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'EMAIL_VERIFIED', target_type: 'creator', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('PUT /api/admin/users/:id/email-verify', { message: err.message });
    return res.status(500).json({ error: 'Failed to verify email.' });
  }
});

// POST /api/admin/users/reset-password
router.post('/users/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required.' });
  try {
    const { rows } = await pool.query(
      'SELECT id FROM creator_accounts WHERE email = $1 LIMIT 1',
      [email]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const hash = await bcrypt.hash(tempPassword, 12);
    await pool.query('UPDATE creator_accounts SET password_hash = $1 WHERE id = $2', [hash, rows[0].id]);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'PASSWORD_RESET', target_type: 'creator_account', target_id: rows[0].id, ip_address: req.ip });
    return res.json({ success: true, temp_password: tempPassword });
  } catch (err) {
    logger.error('POST /api/admin/users/reset-password', { message: err.message });
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// POST /api/admin/users/:id/verify
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

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────

// GET /api/admin/audit
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

// GET /api/admin/audit/export
router.get('/audit/export', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5000');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(rows, null, 2));
  } catch (err) {
    logger.error('GET /api/admin/audit/export', { message: err.message });
    return res.status(500).json({ error: 'Failed to export audit logs.' });
  }
});

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const [totalCreators, totalBusinesses, totalContent, totalOpps, pendingQueue, trend] =
      await Promise.all([
        pool.query('SELECT COUNT(*)::int AS cnt FROM creators'),
        pool.query('SELECT COUNT(*)::int AS cnt FROM businesses'),
        pool.query('SELECT COUNT(*)::int AS cnt FROM content'),
        pool.query('SELECT COUNT(*)::int AS cnt FROM opportunities'),
        pool.query("SELECT COUNT(*)::int AS cnt FROM moderation_queue WHERE status = 'pending'"),
        pool.query(`
          SELECT
            TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
            COUNT(*)::int AS posts
          FROM content
          WHERE created_at >= NOW() - INTERVAL '14 days'
          GROUP BY day
          ORDER BY day ASC
        `),
      ]);
    return res.json({
      kpis: {
        total_creators:   totalCreators.rows[0].cnt,
        total_businesses: totalBusinesses.rows[0].cnt,
        total_content:    totalContent.rows[0].cnt,
        total_opportunities: totalOpps.rows[0].cnt,
        pending_moderation:  pendingQueue.rows[0].cnt,
      },
      trend: trend.rows,
    });
  } catch (err) {
    logger.error('GET /api/admin/analytics', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// ─────────────────────────────────────────────────────────────
// LIVE ALERTS
// ─────────────────────────────────────────────────────────────

// GET /api/admin/alerts
router.get('/alerts', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT action AS type, target_type AS name, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 50'
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/alerts', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch alerts.' });
  }
});

module.exports = router;
