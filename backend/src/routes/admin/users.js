'use strict';
const crypto = require('crypto');
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const sql = require('../../db/client');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');
const { requireAdmin } = require('../../middleware/auth');
const { validationErrorHandler } = require('../../middleware/validate');

const router = express.Router();

// GET /api/admin/users?type=creator|business&search=&limit=&offset=
router.get('/', requireAdmin, async (req, res) => {
  try {
    const type = req.query.type || '';
    const pattern = `%${req.query.search || ''}%`;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
    const offset = parseInt(req.query.offset, 10) || 0;

    const creators = !type || type === 'creator'
      ? await sql`
          SELECT ca.id, 'creator' AS type, ca.email, 'creator' AS role, ca.is_suspended,
                 c.is_verified, ca.created_at, c.display_name AS name, c.username, c.sport,
                 c.follower_count, c.avatar_url
          FROM creator_accounts ca JOIN creators c ON ca.creator_id = c.id
          WHERE ca.email ILIKE ${pattern} OR c.display_name ILIKE ${pattern} OR c.username ILIKE ${pattern}`
      : [];

    const businesses = !type || type === 'business'
      ? await sql`
          SELECT b.id, 'business' AS type, b.email, 'business' AS role, b.is_suspended,
                 b.is_verified, b.created_at, b.company_name AS name, b.slug AS username, b.industry,
                 0 AS follower_count, b.logo_url AS avatar_url
          FROM businesses b
          WHERE b.email ILIKE ${pattern} OR b.company_name ILIKE ${pattern}`
      : [];

    const combined = [...creators, ...businesses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({
      success: true,
      data: combined.slice(offset, offset + limit),
      total: combined.length,
      limit,
      offset,
    });
  } catch (err) {
    logger.error(`GET /api/admin/users: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/users/:type/:id  { action: 'suspend' | 'reactivate' | 'verify' }
router.patch('/:type/:id', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const id = parseInt(req.params.id, 10);
    const { action } = req.body;

    if (!['creator', 'business'].includes(type)) {
      return res.status(400).json({ success: false, error: 'type must be creator or business' });
    }
    if (!['suspend', 'reactivate', 'verify'].includes(action)) {
      return res.status(400).json({ success: false, error: 'action must be suspend, reactivate or verify' });
    }

    let updated;
    if (type === 'business') {
      updated = action === 'verify'
        ? await sql`UPDATE businesses SET is_verified = TRUE WHERE id = ${id} RETURNING id`
        : await sql`UPDATE businesses SET is_suspended = ${action === 'suspend'} WHERE id = ${id} RETURNING id`;
    } else if (action === 'verify') {
      // Verification lives on the public creator profile.
      updated = await sql`
        UPDATE creators SET is_verified = TRUE
        WHERE id = (SELECT creator_id FROM creator_accounts WHERE id = ${id})
        RETURNING id`;
    } else {
      updated = await sql`UPDATE creator_accounts SET is_suspended = ${action === 'suspend'} WHERE id = ${id} RETURNING id`;
    }
    if (!updated.length) return res.status(404).json({ success: false, error: 'User not found' });

    const auditAction = { suspend: 'USER_SUSPENDED', reactivate: 'USER_REACTIVATED', verify: 'USER_VERIFIED' }[action];
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: auditAction, target_type: type, target_id: id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error(`PATCH /api/admin/users/:type/:id: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users/reset-password  { user_id, user_type }
// Returns a one-time temporary password to the admin (never written to logs).
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
      const userId = parseInt(req.body.user_id, 10);
      const tempPassword = crypto.randomBytes(9).toString('base64url');
      const hash = await bcrypt.hash(tempPassword, 12);

      const updated = req.body.user_type === 'business'
        ? await sql`UPDATE businesses SET password_hash = ${hash} WHERE id = ${userId} RETURNING id`
        : await sql`UPDATE creator_accounts SET password_hash = ${hash} WHERE id = ${userId} RETURNING id`;
      if (!updated.length) return res.status(404).json({ success: false, error: 'User not found' });

      await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_PASSWORD_RESET', target_type: req.body.user_type, target_id: userId, ip_address: req.ip });
      return res.json({ success: true, data: { temporary_password: tempPassword } });
    } catch (err) {
      logger.error(`POST /api/admin/users/reset-password: ${err.message}`);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
