'use strict';

const express = require('express');
const { query } = require('express-validator');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const logger = require('../../logger');

const router = express.Router();

// GET /api/admin/audit
router.get(
  '/',
  requireAdmin,
  [
    query('actor_type').optional().isIn(['admin', 'creator', 'business']),
    query('action').optional().trim(),
    query('since').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 50;
      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];

      if (req.query.actor_type) { params.push(req.query.actor_type); conditions.push(`actor_type = $${params.length}`); }
      if (req.query.action) { params.push(`%${req.query.action}%`); conditions.push(`action ILIKE $${params.length}`); }
      if (req.query.since) { params.push(req.query.since); conditions.push(`created_at >= $${params.length}`); }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
      params.push(limit, offset);

      const { rows } = await getPool().query(
        `SELECT id, actor_id, actor_type, action, target_id, target_type, metadata, ip_address, created_at
         FROM audit_log ${where}
         ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );
      return res.json({ log: rows, page, limit });
    } catch (err) {
      logger.error('audit log error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
