'use strict';

const express = require('express');
const { param, body, query } = require('express-validator');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { writeAudit } = require('../../utils/auditLogger');
const logger = require('../../logger');

const router = express.Router();

// GET /api/admin/queue
router.get(
  '/',
  requireAdmin,
  [query('status').optional().isIn(['pending', 'approved', 'rejected']), query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status || 'pending';

      const { rows } = await getPool().query(
        `SELECT mq.id, mq.content_id, mq.reason, mq.status, mq.created_at,
                c.title, c.body, c.media_url, c.sport, c.tags,
                cr.username, cr.display_name, cr.avatar_url
         FROM moderation_queue mq
         JOIN content c ON c.id = mq.content_id
         JOIN creators cr ON cr.id = c.creator_id
         WHERE mq.status = $1
         ORDER BY mq.created_at ASC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset],
      );
      return res.json({ queue: rows, page, limit });
    } catch (err) {
      logger.error('get queue error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/admin/queue/:id — approve or reject
router.patch(
  '/:id',
  requireAdmin,
  [param('id').isInt().toInt(), body('action').isIn(['approve', 'reject']), body('reason').optional().trim()],
  validate,
  async (req, res) => {
    try {
      const { action, reason } = req.body;
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const contentStatus = action === 'approve' ? 'approved' : 'rejected';

      const { rows: qRows } = await getPool().query('SELECT content_id FROM moderation_queue WHERE id = $1', [req.params.id]);
      if (!qRows.length) return res.status(404).json({ error: 'Queue item not found' });

      await getPool().query(
        `UPDATE moderation_queue SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3`,
        [newStatus, req.admin.id, req.params.id],
      );
      await getPool().query(`UPDATE content SET status = $1, updated_at = NOW() WHERE id = $2`, [contentStatus, qRows[0].content_id]);

      writeAudit({ actorId: req.admin.id, actorType: 'admin', action: `queue_${action}`, targetId: qRows[0].content_id, targetType: 'content', metadata: { reason }, ip: req.ip });
      return res.json({ success: true });
    } catch (err) {
      logger.error('moderate queue error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/admin/queue/bulk — bulk approve/reject
router.post(
  '/bulk',
  requireAdmin,
  [body('ids').isArray({ min: 1 }), body('action').isIn(['approve', 'reject'])],
  validate,
  async (req, res) => {
    try {
      const { ids, action } = req.body;
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      const { rows: qRows } = await getPool().query(
        `SELECT id, content_id FROM moderation_queue WHERE id = ANY($1::int[]) AND status = 'pending'`,
        [ids],
      );
      if (!qRows.length) return res.status(404).json({ error: 'No pending items found for given IDs' });

      const contentIds = qRows.map((r) => r.content_id);
      await getPool().query(`UPDATE moderation_queue SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = ANY($3::int[])`, [newStatus, req.admin.id, ids]);
      await getPool().query(`UPDATE content SET status = $1, updated_at = NOW() WHERE id = ANY($2::int[])`, [newStatus, contentIds]);

      writeAudit({ actorId: req.admin.id, actorType: 'admin', action: `bulk_${action}`, metadata: { count: qRows.length }, ip: req.ip });
      return res.json({ success: true, processed: qRows.length });
    } catch (err) {
      logger.error('bulk moderate error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
