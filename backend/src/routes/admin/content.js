'use strict';

const router = require('express').Router();
const { param, validationResult } = require('express-validator');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');

// GET /api/admin/content — all content with filters
router.get('/', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status || null;
    const sport = req.query.sport || null;
    const creator_id = req.query.creator_id || null;

    const conditions = [];
    const params = [];

    if (status) { params.push(status); conditions.push(`c.status = $${params.length}`); }
    if (sport) { params.push(sport); conditions.push(`cr.sport = $${params.length}`); }
    if (creator_id) { params.push(parseInt(creator_id)); conditions.push(`c.creator_id = $${params.length}`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT c.id, c.title, c.body, c.media_url, c.content_type, c.status,
              c.rejection_reason, c.created_at, c.updated_at,
              cr.id AS creator_id, cr.display_name, cr.username, cr.sport
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ content: rows, limit, offset });
  } catch (err) {
    logger.error('Admin content list error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/content/:id — hard delete by admin
router.delete('/:id', requireAdmin, param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });

  try {
    const { rows } = await db.query('DELETE FROM content WHERE id = $1 RETURNING id, title', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Content not found' });

    audit(req.user.sub, 'admin', 'content.hard_delete', { id: req.params.id, title: rows[0].title });
    logger.warn('Admin hard-deleted content', { admin_id: req.user.sub, content_id: req.params.id });

    return res.status(204).send();
  } catch (err) {
    logger.error('Admin content delete error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
