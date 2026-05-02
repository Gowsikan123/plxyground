'use strict';

const express = require('express');
const { param, body, query } = require('express-validator');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { writeAudit } = require('../../utils/auditLogger');
const logger = require('../../logger');

const router = express.Router();

// GET /api/admin/users
router.get(
  '/',
  requireAdmin,
  [query('type').optional().isIn(['creator', 'business']), query('search').optional().trim(), query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const type = req.query.type || 'creator';
      const search = req.query.search;

      let sqlBase, params;
      if (type === 'business') {
        params = [];
        let where = 'WHERE 1=1';
        if (search) { params.push(`%${search}%`); where += ` AND (company_name ILIKE $${params.length} OR email ILIKE $${params.length})`; }
        params.push(limit, offset);
        sqlBase = `SELECT id, company_name, email, slug, is_verified, is_suspended, created_at FROM businesses ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
      } else {
        params = [];
        let where = 'WHERE 1=1';
        if (search) { params.push(`%${search}%`); where += ` AND (username ILIKE $${params.length} OR display_name ILIKE $${params.length} OR email ILIKE $${params.length})`; }
        params.push(limit, offset);
        sqlBase = `SELECT id, username, display_name, email, sport, slug, is_verified, is_suspended, follower_count, created_at FROM creators ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
      }

      const { rows } = await getPool().query(sqlBase, params);
      return res.json({ users: rows, page, limit, type });
    } catch (err) {
      logger.error('admin list users error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/admin/users/:type/:id/suspend
router.patch(
  '/:type/:id/suspend',
  requireAdmin,
  [param('type').isIn(['creator', 'business']), param('id').isInt().toInt(), body('suspended').isBoolean()],
  validate,
  async (req, res) => {
    try {
      const table = req.params.type === 'business' ? 'businesses' : 'creators';
      await getPool().query(`UPDATE ${table} SET is_suspended = $1, updated_at = NOW() WHERE id = $2`, [req.body.suspended, req.params.id]);
      const action = req.body.suspended ? 'suspend_user' : 'reactivate_user';
      writeAudit({ actorId: req.admin.id, actorType: 'admin', action, targetId: req.params.id, targetType: req.params.type, ip: req.ip });
      return res.json({ success: true });
    } catch (err) {
      logger.error('suspend user error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/admin/users/:type/:id/verify
router.patch(
  '/:type/:id/verify',
  requireAdmin,
  [param('type').isIn(['creator', 'business']), param('id').isInt().toInt(), body('verified').isBoolean()],
  validate,
  async (req, res) => {
    try {
      const table = req.params.type === 'business' ? 'businesses' : 'creators';
      await getPool().query(`UPDATE ${table} SET is_verified = $1, updated_at = NOW() WHERE id = $2`, [req.body.verified, req.params.id]);
      writeAudit({ actorId: req.admin.id, actorType: 'admin', action: 'verify_user', targetId: req.params.id, targetType: req.params.type, ip: req.ip });
      return res.json({ success: true });
    } catch (err) {
      logger.error('verify user error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
