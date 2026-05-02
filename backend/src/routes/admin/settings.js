'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const { validate } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../utils/auditLogger');
const config = require('../../config');
const logger = require('../../logger');

// PATCH /api/admin/settings/password
router.patch(
  '/password',
  requireAdmin,
  [
    body('current_password').notEmpty().withMessage('Current password required'),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 chars'),
  ],
  validate,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;

      const result = await db.query('SELECT id, password_hash FROM admins WHERE id = $1', [req.admin.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Admin not found' });

      const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

      const new_hash = await bcrypt.hash(new_password, config.bcrypt.rounds);
      await db.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [new_hash, req.admin.id]);

      auditLog({ actorId: req.admin.id, actorType: 'admin', action: 'admin.password_change', ip: req.ip });
      return res.json({ success: true });
    } catch (err) {
      logger.error('admin.settings.password error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
