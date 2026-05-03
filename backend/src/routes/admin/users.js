'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../../db/client');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');
const { requireAdmin } = require('../../middleware/auth');
const { validationErrorHandler } = require('../../middleware/validate');

const router = express.Router();

// ─── GET /api/admin/users?type=creator|business&search=&limit=&offset= ────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const type    = req.query.type   || '';
    const search  = req.query.search || '';
    const lim     = Math.min(parseInt(req.query.limit)  || 50, 2000);
    const off     = parseInt(req.query.offset) || 0;
    const pattern = `%${search}%`;

    let creatorRows  = { rows: [] };
    let businessRows = { rows: [] };

    if (!type || type === 'creator') {
      creatorRows = await pool.query(
        `SELECT
           ca.id,
           'creator'            AS type,
           ca.email,
           ca.role,
           ca.is_suspended,
           ca.is_email_verified AS is_verified,
           ca.created_at,
           c.display_name       AS name,
           c.username,
           c.sport,
           c.follower_count,
           c.avatar_url
         FROM creator_accounts ca
         JOIN creators c ON ca.creator_id = c.id
         WHERE ca.email ILIKE $1
            OR c.display_name ILIKE $1
            OR c.username ILIKE $1
         ORDER BY ca.created_at DESC
         LIMIT $2`,
        [pattern, lim]
      );
    }

    if (!type || type === 'business') {
      businessRows = await pool.query(
        `SELECT
           b.id,
           'business'           AS type,
           b.email,
           'business'           AS role,
           b.is_suspended,
           b.is_email_verified  AS is_verified,
           b.created_at,
           b.company_name       AS name,
           b.slug               AS username,
           b.industry,
           0                    AS follower_count,
           b.logo_url           AS avatar_url
         FROM businesses b
         WHERE b.email ILIKE $1
            OR b.company_name ILIKE $1
         ORDER BY b.created_at DESC
         LIMIT $2`,
        [pattern, lim]
      );
    }

    // Merge and sort combined results
    const combined = [...creatorRows.rows, ...businessRows.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = combined.length;
    const paged = combined.slice(off, off + lim);

    // Frontend reads: r.data.data  (array)
    return res.json({ success: true, data: paged, total, limit: lim, offset: off });
  } catch (err) {
    logger.error('GET /api/admin/users', { message: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PATCH /api/admin/users/:type/:id  { action: 'suspend'|'reactivate'|'verify' } ─
router.patch('/:type/:id', requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { action } = req.body;

    if (!['creator', 'business'].includes(type))
      return res.status(400).json({ success: false, error: 'type must be creator or business' });
    if (!['suspend', 'reactivate', 'verify'].includes(action))
      return res.status(400).json({ success: false, error: 'action must be suspend, reactivate or verify' });

    const table = type === 'business' ? 'businesses' : 'creator_accounts';
    const { rows } = await pool.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'User not found' });

    if (action === 'suspend') {
      await pool.query(`UPDATE ${table} SET is_suspended = TRUE WHERE id = $1`, [id]);
      await audit.log({ actor_type: 'admin', actor_id: req.user.id, action: 'USER_SUSPENDED', target_type: type, target_id: parseInt(id), ip_address: req.ip });
    } else if (action === 'reactivate') {
      await pool.query(`UPDATE ${table} SET is_suspended = FALSE WHERE id = $1`, [id]);
      await audit.log({ actor_type: 'admin', actor_id: req.user.id, action: 'USER_REACTIVATED', target_type: type, target_id: parseInt(id), ip_address: req.ip });
    } else if (action === 'verify') {
      await pool.query(`UPDATE ${table} SET is_email_verified = TRUE WHERE id = $1`, [id]);
      await audit.log({ actor_type: 'admin', actor_id: req.user.id, action: 'USER_EMAIL_VERIFIED', target_type: type, target_id: parseInt(id), ip_address: req.ip });
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error('PATCH /api/admin/users/:type/:id', { message: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/admin/users/:userId/role ───────────────────────────────────────
router.put(
  '/:userId/role',
  requireAdmin,
  [body('role').isIn(['creator', 'admin']).withMessage('role must be creator or admin')],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id FROM creator_accounts WHERE id = $1', [req.params.userId]);
      if (!rows[0]) return res.status(404).json({ success: false, error: 'Creator account not found' });
      await pool.query('UPDATE creator_accounts SET role = $1 WHERE id = $2', [req.body.role, req.params.userId]);
      await audit.log({ actor_type: 'admin', actor_id: req.user.id, action: 'USER_ROLE_CHANGED', target_type: 'creator', target_id: parseInt(req.params.userId), metadata: { role: req.body.role }, ip_address: req.ip });
      return res.json({ success: true });
    } catch (err) {
      logger.error('PUT /api/admin/users/:userId/role', { message: err.message });
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─── POST /api/admin/users/reset-password ────────────────────────────────────
router.post(
  '/reset-password',
  requireAdmin,
  [
    body('user_id').isInt().withMessage('user_id required'),
    body('user_type').isIn(['creator', 'business']).withMessage('user_type required'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { user_id, user_type } = req.body;
      const table = user_type === 'business' ? 'businesses' : 'creator_accounts';
      const { rows } = await pool.query(`SELECT id FROM ${table} WHERE id = $1`, [user_id]);
      if (!rows[0]) return res.status(404).json({ success: false, error: 'User not found' });

      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
      let tempPass = '';
      for (let i = 0; i < 12; i++) tempPass += chars[Math.floor(Math.random() * chars.length)];

      const hash = await bcrypt.hash(tempPass, 12);
      await pool.query(`UPDATE ${table} SET password_hash = $1 WHERE id = $2`, [hash, user_id]);
      logger.warn(`[ADMIN] Temp password for ${user_type} #${user_id}: ${tempPass}`);

      await audit.log({ actor_type: 'admin', actor_id: req.user.id, action: 'USER_PASSWORD_RESET', target_type: user_type, target_id: user_id, ip_address: req.ip });
      return res.json({ success: true, data: { message: 'Password reset. Check server logs.' } });
    } catch (err) {
      logger.error('POST /api/admin/users/reset-password', { message: err.message });
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
