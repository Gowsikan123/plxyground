'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const sql = require('../../db/client');
const { validationErrorHandler } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = express.Router();

// PATCH /api/admin/settings/password  { current_password, new_password }
router.patch(
  '/password',
  requireAdmin,
  [
    body('current_password').notEmpty().withMessage('Current password required'),
    body('new_password').isLength({ min: 12 }).withMessage('New password must be at least 12 characters'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const [admin] = await sql`SELECT id, password_hash FROM admin_users WHERE id = ${req.admin.id}`;
      if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

      const valid = await bcrypt.compare(current_password, admin.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Current password incorrect' });

      const newHash = await bcrypt.hash(new_password, 12);
      await sql`UPDATE admin_users SET password_hash = ${newHash} WHERE id = ${admin.id}`;

      await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_PASSWORD_CHANGED', ip_address: req.ip });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
