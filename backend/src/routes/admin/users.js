'use strict';
const express = require('express');
const { param, body, query: qv } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const { validate } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../utils/auditLogger');
const logger = require('../../logger');

// GET /api/admin/users
router.get(
  '/',
  requireAdmin,
  [qv('type').optional().isIn(['creator', 'business']), qv('page').optional().isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const type  = req.query.type || 'creator';
      const page  = parseInt(req.query.page || '1', 10);
      const limit = 30;
      const offset = (page - 1) * limit;

      let sql, params = [];
      if (type === 'business') {
        sql = `SELECT id, name, email, industry, slug, is_verified, is_suspended, created_at FROM businesses ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        sql = `SELECT id, username, display_name, email, sport, slug, is_verified, is_suspended, follower_count, created_at FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      }
      const result = await db.query(sql, params);
      return res.json({ users: result.rows, type, page, limit });
    } catch (err) {
      logger.error('admin.users.list error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/admin/users/:type/:id — suspend / reactivate / verify
router.patch(
  '/:type/:id',
  requireAdmin,
  [
    param('type').isIn(['creator', 'business']),
    param('id').isInt(),
    body('action').isIn(['suspend', 'reactivate', 'verify']).withMessage('Invalid action'),
  ],
  validate,
  async (req, res) => {
    try {
      const { type, id } = req.params;
      const { action } = req.body;
      const table = type === 'business' ? 'businesses' : 'users';

      let sql;
      if (action === 'suspend')    sql = `UPDATE ${table} SET is_suspended = TRUE,  updated_at = NOW() WHERE id = $1 RETURNING id`;
      if (action === 'reactivate') sql = `UPDATE ${table} SET is_suspended = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`;
      if (action === 'verify')     sql = `UPDATE ${table} SET is_verified  = TRUE,  updated_at = NOW() WHERE id = $1 RETURNING id`;

      const result = await db.query(sql, [id]);
      if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

      auditLog({ actorId: req.admin.id, actorType: 'admin', action: `user.${action}`, targetType: type, targetId: parseInt(id, 10), ip: req.ip });
      return res.json({ success: true, action, id: parseInt(id, 10) });
    } catch (err) {
      logger.error('admin.users.update error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
