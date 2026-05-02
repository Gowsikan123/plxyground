'use strict';

const express = require('express');
const { query: qv } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const logger = require('../../logger');

// GET /api/admin/audit
router.get(
  '/',
  requireAuth,
  requireAdmin,
  [
    qv('page').optional().isInt({ min: 1 }).toInt(),
    qv('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    qv('actor_type').optional().isIn(['creator', 'business', 'admin', 'system']),
    qv('action').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 50;
      const offset = (page - 1) * limit;

      const params = [limit, offset];
      const clauses = [];

      if (req.query.actor_type) {
        params.push(req.query.actor_type);
        clauses.push(`actor_type = $${params.length}`);
      }
      if (req.query.action) {
        params.push(`%${req.query.action}%`);
        clauses.push(`action ILIKE $${params.length}`);
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

      const { rows } = await db.query(
        `SELECT id, actor_id, actor_type, action, target_type, target_id, meta, ip, created_at
         FROM audit_log
         ${where}
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const { rows: countRows } = await db.query(
        `SELECT COUNT(*) AS total FROM audit_log ${where}`,
        params.slice(2)
      );

      res.json({
        logs: rows,
        pagination: { page, limit, total: parseInt(countRows[0].total, 10) },
      });
    } catch (err) {
      logger.error('admin.audit.list error', { message: err.message });
      res.status(500).json({ error: 'Failed to fetch audit log' });
    }
  }
);

module.exports = router;
