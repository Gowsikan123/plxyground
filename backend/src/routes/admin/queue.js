'use strict';

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const auditLog = require('../../utils/auditLogger');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const logger = require('../../logger');

// GET /api/admin/queue  — pending content
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.title, c.body, c.media_url, c.media_type, c.sport, c.tags, c.created_at,
              u.id AS author_id, u.username, u.display_name, u.avatar_url
       FROM content c
       JOIN users u ON u.id = c.user_id
       WHERE c.status = 'pending'
       ORDER BY c.created_at ASC`
    );
    res.json({ queue: rows, total: rows.length });
  } catch (err) {
    logger.error('admin.queue.list error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// POST /api/admin/queue/:id/approve
router.post('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE content SET status = 'approved', rejection_reason = NULL, updated_at = NOW()
       WHERE id = $1 AND status = 'pending' RETURNING id, title, status`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Content not found or not pending' });

    auditLog({ actorId: req.user.id, actorType: 'admin', action: 'content.approved', targetType: 'content', targetId: req.params.id, ip: req.ip });
    res.json({ content: rows[0] });
  } catch (err) {
    logger.error('admin.queue.approve error', { message: err.message });
    res.status(500).json({ error: 'Failed to approve content' });
  }
});

// POST /api/admin/queue/:id/reject
router.post(
  '/:id/reject',
  requireAuth,
  requireAdmin,
  [body('reason').optional().trim().isLength({ max: 500 })],
  validate,
  async (req, res) => {
    try {
      const reason = req.body.reason || null;
      const { rows } = await db.query(
        `UPDATE content SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
         WHERE id = $2 AND status = 'pending' RETURNING id, title, status`,
        [reason, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Content not found or not pending' });

      auditLog({ actorId: req.user.id, actorType: 'admin', action: 'content.rejected', targetType: 'content', targetId: req.params.id, meta: { reason }, ip: req.ip });
      res.json({ content: rows[0] });
    } catch (err) {
      logger.error('admin.queue.reject error', { message: err.message });
      res.status(500).json({ error: 'Failed to reject content' });
    }
  }
);

// POST /api/admin/queue/bulk  — bulk approve/reject
router.post(
  '/bulk',
  requireAuth,
  requireAdmin,
  [
    body('ids').isArray({ min: 1 }),
    body('action').isIn(['approve', 'reject']),
    body('reason').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { ids, action, reason } = req.body;
      const status = action === 'approve' ? 'approved' : 'rejected';

      const { rowCount } = await db.query(
        `UPDATE content
         SET status = $1,
             rejection_reason = $2,
             updated_at = NOW()
         WHERE id = ANY($3::uuid[]) AND status = 'pending'`,
        [status, reason || null, ids]
      );

      auditLog({ actorId: req.user.id, actorType: 'admin', action: `content.bulk.${action}`, meta: { ids, count: rowCount }, ip: req.ip });
      res.json({ updated: rowCount });
    } catch (err) {
      logger.error('admin.queue.bulk error', { message: err.message });
      res.status(500).json({ error: 'Bulk action failed' });
    }
  }
);

module.exports = router;
