'use strict';

const express = require('express');
const { param, body, query } = require('express-validator');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { writeAudit } = require('../../utils/auditLogger');
const logger = require('../../logger');

const router = express.Router();

// GET /api/admin/content
router.get(
  '/',
  requireAdmin,
  [query('status').optional().isIn(['pending', 'approved', 'rejected']), query('sport').optional().trim(), query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];

      if (req.query.status) { params.push(req.query.status); conditions.push(`c.status = $${params.length}`); }
      if (req.query.sport) { params.push(req.query.sport); conditions.push(`c.sport = $${params.length}`); }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
      params.push(limit, offset);

      const { rows } = await getPool().query(
        `SELECT c.id, c.title, c.body, c.sport, c.status, c.is_flagged, c.view_count, c.like_count, c.created_at,
                cr.username, cr.display_name
         FROM content c JOIN creators cr ON cr.id = c.creator_id
         ${where}
         ORDER BY c.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );
      return res.json({ content: rows, page, limit });
    } catch (err) {
      logger.error('admin list content error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// DELETE /api/admin/content/:id
router.delete('/:id', requireAdmin, [param('id').isInt().toInt()], validate, async (req, res) => {
  try {
    await getPool().query('DELETE FROM content WHERE id = $1', [req.params.id]);
    writeAudit({ actorId: req.admin.id, actorType: 'admin', action: 'delete_content', targetId: req.params.id, targetType: 'content', ip: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('admin delete content error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/content/:id/flag
router.patch('/:id/flag', requireAdmin, [param('id').isInt().toInt(), body('flagged').isBoolean()], validate, async (req, res) => {
  try {
    await getPool().query('UPDATE content SET is_flagged = $1, updated_at = NOW() WHERE id = $2', [req.body.flagged, req.params.id]);
    writeAudit({ actorId: req.admin.id, actorType: 'admin', action: req.body.flagged ? 'flag_content' : 'unflag_content', targetId: req.params.id, targetType: 'content', ip: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('admin flag content error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
