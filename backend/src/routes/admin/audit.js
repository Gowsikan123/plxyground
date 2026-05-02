'use strict';

const router = require('express').Router();
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const logger = require('../../logger');

// GET /api/admin/audit — paginated audit log
router.get('/', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const actor_type = req.query.actor_type || null;
    const action = req.query.action || null;
    const actor_id = req.query.actor_id || null;
    const since = req.query.since || null;

    const conditions = [];
    const params = [];

    if (actor_type) { params.push(actor_type); conditions.push(`actor_type = $${params.length}`); }
    if (action) { params.push(action); conditions.push(`action = $${params.length}`); }
    if (actor_id) { params.push(parseInt(actor_id)); conditions.push(`actor_id = $${params.length}`); }
    if (since) { params.push(since); conditions.push(`created_at >= $${params.length}`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT id, actor_id, actor_type, action, metadata, created_at
       FROM audit_logs
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM audit_logs ${where}`,
      params.slice(0, params.length - 2)
    );

    return res.json({
      logs: rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  } catch (err) {
    logger.error('Audit log list error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/audit/export — full JSON export (no pagination)
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const since = req.query.since || null;
    const params = [];
    let where = '';
    if (since) { params.push(since); where = `WHERE created_at >= $1`; }

    const { rows } = await db.query(
      `SELECT id, actor_id, actor_type, action, metadata, created_at
       FROM audit_logs ${where}
       ORDER BY created_at DESC`,
      params
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-export-${Date.now()}.json"`);
    return res.json({ exported_at: new Date().toISOString(), count: rows.length, logs: rows });
  } catch (err) {
    logger.error('Audit export error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
