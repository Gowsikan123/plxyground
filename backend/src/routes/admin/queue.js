'use strict';

const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');

// GET /api/admin/queue — pending content for moderation
router.get('/', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const { rows } = await db.query(
      `SELECT c.id, c.title, c.body, c.media_url, c.content_type, c.status, c.created_at,
              cr.id AS creator_id, cr.display_name, cr.username, cr.sport, cr.slug
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       WHERE c.status = 'pending'
       ORDER BY c.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const count = await db.query("SELECT COUNT(*) FROM content WHERE status = 'pending'");

    return res.json({
      queue: rows,
      total: parseInt(count.rows[0].count),
      limit,
      offset,
    });
  } catch (err) {
    logger.error('Queue list error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/queue/:id — approve or reject single item
router.patch('/:id', requireAdmin, param('id').isInt(), [
  body('action').isIn(['approve', 'reject']),
  body('rejection_reason').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Validation failed' });

  const { action, rejection_reason } = req.body;
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  try {
    const { rows } = await db.query(
      `UPDATE content
       SET status=$1, rejection_reason=$2, moderated_by=$3, moderated_at=NOW(), updated_at=NOW()
       WHERE id=$4
       RETURNING id, title, status, moderated_at`,
      [newStatus, rejection_reason || null, req.user.sub, req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Content not found' });

    audit(req.user.sub, 'admin', `content.${action}`, { id: req.params.id, rejection_reason });
    logger.info(`Content ${action}d`, { admin_id: req.user.sub, content_id: req.params.id });

    return res.json({ content: rows[0] });
  } catch (err) {
    logger.error('Queue action error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/queue/bulk — bulk approve or reject
router.post('/bulk', requireAdmin, [
  body('ids').isArray({ min: 1, max: 50 }),
  body('ids.*').isInt(),
  body('action').isIn(['approve', 'reject']),
  body('rejection_reason').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { ids, action, rejection_reason } = req.body;
  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  try {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const params = [...ids, newStatus, rejection_reason || null, req.user.sub];

    const { rowCount } = await db.query(
      `UPDATE content
       SET status=$${ids.length + 1}, rejection_reason=$${ids.length + 2},
           moderated_by=$${ids.length + 3}, moderated_at=NOW(), updated_at=NOW()
       WHERE id IN (${placeholders}) AND status = 'pending'`,
      params
    );

    audit(req.user.sub, 'admin', `content.bulk_${action}`, { ids, count: rowCount });
    logger.info(`Bulk ${action}: ${rowCount} items`, { admin_id: req.user.sub });

    return res.json({ updated: rowCount, action });
  } catch (err) {
    logger.error('Queue bulk action error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
