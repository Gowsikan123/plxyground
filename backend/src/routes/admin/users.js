'use strict';

const express = require('express');
const { query: qv, body } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const auditLog = require('../../utils/auditLogger');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const logger = require('../../logger');

// GET /api/admin/users  — list all users with optional search
router.get(
  '/',
  requireAuth,
  requireAdmin,
  [
    qv('page').optional().isInt({ min: 1 }).toInt(),
    qv('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    qv('search').optional().trim(),
    qv('role').optional().isIn(['creator', 'admin']),
  ],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search || null;
      const role = req.query.role || null;

      const params = [limit, offset];
      const clauses = [];

      if (search) {
        params.push(`%${search}%`);
        clauses.push(`(username ILIKE $${params.length} OR email ILIKE $${params.length} OR display_name ILIKE $${params.length})`);
      }
      if (role) {
        params.push(role);
        clauses.push(`role = $${params.length}`);
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

      const { rows } = await db.query(
        `SELECT id, username, email, display_name, role, sport, is_verified, is_suspended, follower_count, created_at
         FROM users
         ${where}
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const { rows: countRows } = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, params.slice(2));
      res.json({ users: rows, pagination: { page, limit, total: parseInt(countRows[0].total, 10) } });
    } catch (err) {
      logger.error('admin.users.list error', { message: err.message });
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// POST /api/admin/users/:id/suspend
router.post('/:id/suspend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE users SET is_suspended = TRUE, updated_at = NOW()
       WHERE id = $1 AND role != 'admin' RETURNING id, username, is_suspended`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found or is admin' });

    auditLog({ actorId: req.user.id, actorType: 'admin', action: 'user.suspended', targetType: 'user', targetId: req.params.id, ip: req.ip });
    res.json({ user: rows[0] });
  } catch (err) {
    logger.error('admin.users.suspend error', { message: err.message });
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// POST /api/admin/users/:id/reactivate
router.post('/:id/reactivate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE users SET is_suspended = FALSE, updated_at = NOW()
       WHERE id = $1 RETURNING id, username, is_suspended`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    auditLog({ actorId: req.user.id, actorType: 'admin', action: 'user.reactivated', targetType: 'user', targetId: req.params.id, ip: req.ip });
    res.json({ user: rows[0] });
  } catch (err) {
    logger.error('admin.users.reactivate error', { message: err.message });
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
});

// POST /api/admin/users/:id/verify
router.post('/:id/verify', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, username, is_verified`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    auditLog({ actorId: req.user.id, actorType: 'admin', action: 'user.verified', targetType: 'user', targetId: req.params.id, ip: req.ip });
    res.json({ user: rows[0] });
  } catch (err) {
    logger.error('admin.users.verify error', { message: err.message });
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

module.exports = router;
