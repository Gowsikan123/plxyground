'use strict';

const express = require('express');
const { query: qv } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const auditLog = require('../../utils/auditLogger');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const logger = require('../../logger');

// GET /api/admin/content  — all content with filters
router.get(
  '/',
  requireAuth,
  requireAdmin,
  [
    qv('page').optional().isInt({ min: 1 }).toInt(),
    qv('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    qv('status').optional().isIn(['pending', 'approved', 'rejected']),
  ],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status || null;

      const params = [limit, offset];
      let statusClause = '';
      if (status) {
        params.push(status);
        statusClause = `AND c.status = $${params.length}`;
      }

      const { rows } = await db.query(
        `SELECT c.id, c.title, c.body, c.media_type, c.sport, c.status, c.rejection_reason,
                c.like_count, c.view_count, c.created_at,
                u.id AS author_id, u.username, u.display_name
         FROM content c
         JOIN users u ON u.id = c.user_id
         WHERE 1=1 ${statusClause}
         ORDER BY c.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      res.json({ content: rows, pagination: { page, limit } });
    } catch (err) {
      logger.error('admin.content.list error', { message: err.message });
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  }
);

// DELETE /api/admin/content/:id  — hard delete
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM content WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Content not found' });

    auditLog({ actorId: req.user.id, actorType: 'admin', action: 'content.deleted', targetType: 'content', targetId: req.params.id, ip: req.ip });
    res.status(204).end();
  } catch (err) {
    logger.error('admin.content.delete error', { message: err.message });
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;
