'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/client');      // PostgreSQL – used for admin_users only
const db   = require('../db/sqlite');     // SQLite  – used for all creator/content/queue data
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { signToken } = require('../utils/jwt');
const { authLimiter } = require('../middleware/rateLimiter');
const auditLogger = require('../utils/auditLogger');
const logger = require('../logger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// AUTH  (no requireAuth — these are the login endpoints)
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
// STATS  — all tables are in SQLite
// ─────────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const creators   = db.prepare('SELECT COUNT(*) AS cnt FROM creators').get();
    const businesses = db.prepare('SELECT COUNT(*) AS cnt FROM businesses').get();
    const content    = db.prepare("SELECT COUNT(*) AS cnt FROM content WHERE status = 'published'").get();
    const opps       = db.prepare("SELECT COUNT(*) AS cnt FROM opportunities WHERE status = 'published'").get();
    const queue      = db.prepare("SELECT COUNT(*) AS cnt FROM moderation_queue WHERE status = 'pending'").get();
    return res.json({
      creators:             creators.cnt,
      businesses:           businesses.cnt,
      published_content:    content.cnt,
      published_opportunities: opps.cnt,
      pending_moderation:   queue.cnt,
    });
  } catch (err) {
    logger.error('GET /api/admin/stats', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ─────────────────────────────────────────────────────────────
// MODERATION QUEUE  — SQLite
// ─────────────────────────────────────────────────────────────

// GET /api/admin/moderation  (backward-compat)
router.get('/moderation', (req, res) => {
  try {
    const lim = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const off = parseInt(req.query.offset, 10) || 0;
    const rows = db.prepare(
      "SELECT * FROM moderation_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT ? OFFSET ?"
    ).all(lim, off);
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/moderation', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch moderation queue.' });
  }
});

// GET /api/admin/queue  (called by admin panel)
// Fixed: separate JOINs per content_type, no OR poison, WHERE status = 'pending'
router.get('/queue', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT
        mq.id,
        mq.content_type        AS type,
        mq.status,
        mq.created_at,
        COALESCE(c.title, bc.title, o.title) AS title_or_name,
        CASE
          WHEN mq.content_type = 'content'          THEN COALESCE(cr.display_name, 'Unknown')
          WHEN mq.content_type = 'business_content' THEN COALESCE(b_bc.organization_name, 'Unknown')
          WHEN mq.content_type = 'opportunity'      THEN COALESCE(b_op.organization_name, 'Unknown')
          ELSE 'Unknown'
        END AS submitted_by
      FROM moderation_queue mq
      LEFT JOIN content          c    ON mq.content_type = 'content'          AND mq.content_id = c.id
      LEFT JOIN business_content bc   ON mq.content_type = 'business_content' AND mq.content_id = bc.id
      LEFT JOIN opportunities    o    ON mq.content_type = 'opportunity'       AND mq.content_id = o.id
      LEFT JOIN creators         cr   ON c.creator_id    = cr.id
      LEFT JOIN businesses       b_bc ON bc.business_id  = b_bc.id
      LEFT JOIN businesses       b_op ON o.business_id   = b_op.id
      WHERE mq.status = 'pending'
      ORDER BY mq.created_at DESC
    `).all();
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/queue', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch queue.' });
  }
});

// POST /api/admin/queue/bulk-action
router.post('/queue/bulk-action', async (req, res) => {
  const { action, ids } = req.body;
  if (!action || !Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: 'action and ids[] required.' });
  }
  if (!['approve', 'reject', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'action must be approve, reject, or delete.' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    if (action === 'delete') {
      db.prepare(`DELETE FROM moderation_queue WHERE id IN (${placeholders})`).run(...ids);
    } else {
      const newStatus    = action === 'approve' ? 'approved' : 'rejected';
      const contentStatus = action === 'approve' ? 'published' : 'rejected';
      const items = db.prepare(`SELECT * FROM moderation_queue WHERE id IN (${placeholders})`).all(...ids);
      for (const item of items) {
        const table = item.content_type === 'business_content' ? 'business_content'
                    : item.content_type === 'opportunity'      ? 'opportunities'
                    : 'content';
        db.prepare(
          `UPDATE moderation_queue SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).run(newStatus, req.user.id, item.id);
        db.prepare(`UPDATE ${table} SET status = ? WHERE id = ?`).run(contentStatus, item.content_id);
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

// POST /api/admin/moderation/:id/approve  (backward-compat)
router.post('/moderation/:id/approve', async (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found.' });
    const table = item.content_type === 'business_content' ? 'business_content' : 'content';
    db.prepare("UPDATE moderation_queue SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.user.id, req.params.id);
    db.prepare(`UPDATE ${table} SET status = 'published' WHERE id = ?`).run(item.content_id);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'MODERATION_APPROVED', target_type: item.content_type, target_id: item.content_id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/moderation/:id/approve', { message: err.message });
    return res.status(500).json({ error: 'Failed to approve.' });
  }
});

// POST /api/admin/moderation/:id/reject  (backward-compat)
router.post('/moderation/:id/reject', async (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found.' });
    const table = item.content_type === 'business_content' ? 'business_content' : 'content';
    const reason = req.body.reason || null;
    db.prepare("UPDATE moderation_queue SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ? WHERE id = ?").run(req.user.id, reason, req.params.id);
    db.prepare(`UPDATE ${table} SET status = 'rejected' WHERE id = ?`).run(item.content_id);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'MODERATION_REJECTED', target_type: item.content_type, target_id: item.content_id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/moderation/:id/reject', { message: err.message });
    return res.status(500).json({ error: 'Failed to reject.' });
  }
});

// ─────────────────────────────────────────────────────────────
// CONTENT  — SQLite
// ─────────────────────────────────────────────────────────────

// GET /api/admin/content?search=&limit=
router.get('/content', (req, res) => {
  try {
    const lim     = Math.min(parseInt(req.query.limit, 10) || 50, 2000);
    const pattern = `%${req.query.search || ''}%`;
    const rows = db.prepare(`
      SELECT c.*, cr.display_name AS creator_name
      FROM content c
      LEFT JOIN creators cr ON c.creator_id = cr.id
      WHERE c.title LIKE ? OR cr.display_name LIKE ?
      ORDER BY c.created_at DESC
      LIMIT ?
    `).all(pattern, pattern, lim);
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/admin/content', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

// PUT /api/admin/content/:id
router.put('/content/:id', async (req, res) => {
  try {
    const { is_published } = req.body;
    const status = is_published ? 'published' : 'pending';
    const info = db.prepare('UPDATE content SET status = ? WHERE id = ?').run(status, req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Not found.' });
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: is_published ? 'CONTENT_PUBLISHED' : 'CONTENT_UNPUBLISHED', target_type: 'content', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('PUT /api/admin/content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update content.' });
  }
});

// DELETE /api/admin/content/:id
router.delete('/content/:id', async (req, res) => {
  try {
    const info = db.prepare('DELETE FROM content WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Not found.' });
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'CONTENT_DELETED', target_type: 'content', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/admin/content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to delete content.' });
  }
});

// ─────────────────────────────────────────────────────────────
// OPPORTUNITIES  — SQLite
// ─────────────────────────────────────────────────────────────

// GET /api/admin/opportunities?search=&limit=
router.get('/opportunities', (req, res) => {
  try {
    const lim     = Math.min(parseInt(req.query.limit, 10) || 50, 2000);
    const pattern = `%${req.query.search || ''}%`;
    const rows = db.prepare(`
      SELECT o.*, b.organization_name AS creator_name
      FROM opportunities o
      LEFT JOIN businesses b ON o.business_id = b.id
      WHERE o.title LIKE ? OR b.organization_name LIKE ?
      ORDER BY o.created_at DESC
      LIMIT ?
    `).all(pattern, pattern, lim);
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
    const status = moderation_status === 'rejected' ? 'rejected'
                 : is_published ? 'published' : 'pending';
    const info = db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run(status, req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Not found.' });
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'OPPORTUNITY_STATUS_CHANGED', target_type: 'opportunity', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('PUT /api/admin/opportunities/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update opportunity.' });
  }
});

// DELETE /api/admin/opportunities/:id
router.delete('/opportunities/:id', async (req, res) => {
  try {
    const info = db.prepare('DELETE FROM opportunities WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Not found.' });
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'OPPORTUNITY_DELETED', target_type: 'opportunity', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/admin/opportunities/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to delete opportunity.' });
  }
});

// ─────────────────────────────────────────────────────────────
// USERS  — SQLite
// Fixed: was using pool (PostgreSQL) — now uses db (SQLite)
// ─────────────────────────────────────────────────────────────

// GET /api/admin/users?search=
router.get('/users', (req, res) => {
  try {
    const pattern = `%${req.query.search || ''}%`;

    const creators = db.prepare(`
      SELECT
        ca.id,
        cr.display_name  AS name,
        ca.email,
        'creator'        AS role,
        ca.is_suspended,
        ca.created_at
      FROM creator_accounts ca
      JOIN creators cr ON cr.id = ca.creator_id
      WHERE cr.display_name LIKE ? OR ca.email LIKE ?
    `).all(pattern, pattern);

    const businesses = db.prepare(`
      SELECT
        b.id,
        b.organization_name AS name,
        b.email,
        'business'          AS role,
        b.is_suspended,
        b.created_at
      FROM businesses b
      WHERE b.organization_name LIKE ? OR b.email LIKE ?
    `).all(pattern, pattern);

    const combined = [...creators, ...businesses]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 500);

    return res.json({ data: combined });
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
      db.prepare('UPDATE creator_accounts SET is_suspended = 1 WHERE creator_id = ?').run(req.params.id);
    } else {
      db.prepare('UPDATE businesses SET is_suspended = 1 WHERE id = ?').run(req.params.id);
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
      db.prepare('UPDATE businesses SET is_suspended = 0 WHERE id = ?').run(req.params.id);
    } else {
      db.prepare('UPDATE creator_accounts SET is_suspended = 0 WHERE creator_id = ?').run(req.params.id);
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
    db.prepare('UPDATE creator_accounts SET is_email_verified = 1 WHERE creator_id = ?').run(req.params.id);
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
    const row = db.prepare('SELECT id FROM creator_accounts WHERE email = ? LIMIT 1').get(email);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const hash = await bcrypt.hash(tempPassword, 12);
    db.prepare('UPDATE creator_accounts SET password_hash = ? WHERE id = ?').run(hash, row.id);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'PASSWORD_RESET', target_type: 'creator_account', target_id: row.id, ip_address: req.ip });
    return res.json({ success: true, temp_password: tempPassword });
  } catch (err) {
    logger.error('POST /api/admin/users/reset-password', { message: err.message });
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// POST /api/admin/users/:id/verify
router.post('/users/:id/verify', async (req, res) => {
  try {
    db.prepare('UPDATE creators SET is_verified = 1 WHERE id = ?').run(req.params.id);
    await auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'CREATOR_VERIFIED', target_type: 'creator', target_id: req.params.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('POST /api/admin/users/:id/verify', { message: err.message });
    return res.status(500).json({ error: 'Failed to verify creator.' });
  }
});

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS  — still on PostgreSQL (audit_logs lives there)
// ─────────────────────────────────────────────────────────────

// GET /api/admin/audit
router.get('/audit', async (req, res) => {
  try {
    const lim = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const off = parseInt(req.query.offset, 10) || 0;
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
// ANALYTICS  — SQLite
// ─────────────────────────────────────────────────────────────

// GET /api/admin/analytics
router.get('/analytics', (req, res) => {
  try {
    const totalCreators   = db.prepare('SELECT COUNT(*) AS cnt FROM creators').get();
    const totalBusinesses = db.prepare('SELECT COUNT(*) AS cnt FROM businesses').get();
    const totalContent    = db.prepare('SELECT COUNT(*) AS cnt FROM content').get();
    const totalOpps       = db.prepare('SELECT COUNT(*) AS cnt FROM opportunities').get();
    const pendingQueue    = db.prepare("SELECT COUNT(*) AS cnt FROM moderation_queue WHERE status = 'pending'").get();
    const trend           = db.prepare(`
      SELECT
        strftime('%Y-%m-%d', created_at) AS day,
        COUNT(*) AS posts
      FROM content
      WHERE created_at >= datetime('now', '-14 days')
      GROUP BY day
      ORDER BY day ASC
    `).all();
    return res.json({
      kpis: {
        total_creators:      totalCreators.cnt,
        total_businesses:    totalBusinesses.cnt,
        total_content:       totalContent.cnt,
        total_opportunities: totalOpps.cnt,
        pending_moderation:  pendingQueue.cnt,
      },
      trend,
    });
  } catch (err) {
    logger.error('GET /api/admin/analytics', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// ─────────────────────────────────────────────────────────────
// LIVE ALERTS  — PostgreSQL (audit_logs)
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
