'use strict';
const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const { validate } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../utils/auditLogger');
const logger = require('../../logger');

// GET /api/admin/queue — pending + flagged content
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.title, c.body, c.media_url, c.media_type, c.sport, c.tags, c.status, c.created_at,
              u.id AS user_id, u.display_name, u.username, u.avatar_url
       FROM content c
       JOIN users u ON u.id = c.user_id
       WHERE c.status IN ('pending', 'flagged')
       ORDER BY c.created_at ASC`,
    );
    return res.json({ queue: result.rows });
  } catch (err) {
    logger.error('admin.queue.list error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/queue/:id — approve / reject / flag
router.patch(
  '/:id',
  requireAdmin,
  [
    param('id').isInt(),
    body('status').isIn(['approved', 'rejected', 'flagged']).withMessage('Invalid status'),
    body('moderation_note').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { status, moderation_note } = req.body;
      const result = await db.query(
        `UPDATE content SET status = $1, moderation_note = $2, moderated_by = $3, moderated_at = NOW(), updated_at = NOW()
         WHERE id = $4 RETURNING id, title, status`,
        [status, moderation_note || null, req.admin.id, req.params.id],
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Content not found' });

      auditLog({ actorId: req.admin.id, actorType: 'admin', action: `content.${status}`, targetType: 'content', targetId: parseInt(req.params.id, 10), meta: { note: moderation_note }, ip: req.ip });
      return res.json({ content: result.rows[0] });
    } catch (err) {
      logger.error('admin.queue.update error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// POST /api/admin/queue/bulk — bulk moderate
router.post(
  '/bulk',
  requireAdmin,
  [
    body('ids').isArray({ min: 1 }).withMessage('ids array required'),
    body('status').isIn(['approved', 'rejected']).withMessage('Invalid status'),
  ],
  validate,
  async (req, res) => {
    try {
      const { ids, status, moderation_note } = req.body;
      const safeIds = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
      if (!safeIds.length) return res.status(400).json({ error: 'No valid IDs provided' });

      await db.query(
        `UPDATE content SET status = $1, moderation_note = $2, moderated_by = $3, moderated_at = NOW()
         WHERE id = ANY($4::int[])`,
        [status, moderation_note || null, req.admin.id, safeIds],
      );

      auditLog({ actorId: req.admin.id, actorType: 'admin', action: `content.bulk.${status}`, meta: { ids: safeIds, count: safeIds.length }, ip: req.ip });
      return res.json({ success: true, updated: safeIds.length });
    } catch (err) {
      logger.error('admin.queue.bulk error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
