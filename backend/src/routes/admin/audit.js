'use strict';
const express = require('express');
const { query: qv } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const { validate } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const logger = require('../../logger');

// GET /api/admin/audit
router.get(
  '/',
  requireAdmin,
  [
    qv('actor_type').optional().isIn(['user', 'business', 'admin', 'system']),
    qv('action').optional().trim(),
    qv('page').optional().isInt({ min: 1 }),
    qv('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const page   = parseInt(req.query.page  || '1',  10);
      const limit  = parseInt(req.query.limit || '50', 10);
      const offset = (page - 1) * limit;

      const params = [];
      const conditions = [];
      if (req.query.actor_type) conditions.push(`actor_type = $${params.push(req.query.actor_type)}`);
      if (req.query.action)     conditions.push(`action ILIKE $${params.push('%' + req.query.action + '%')}`);

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
      const sql   = `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await db.query(sql, params);
      return res.json({ logs: result.rows, page, limit });
    } catch (err) {
      logger.error('admin.audit.list error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
