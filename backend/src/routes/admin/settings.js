'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../../db/client');
const { validationErrorHandler } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

// PATCH /api/admin/settings/password
router.patch(
  '/password',
  requireAdmin,
  [
    body('current_password').notEmpty().withMessage('Current password required'),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 chars'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const admin = db.prepare('SELECT id, password_hash FROM admins WHERE id = ?').get(req.admin.id);
      if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

      const valid = bcrypt.compareSync(current_password, admin.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Current password incorrect' });

      const newHash = bcrypt.hashSync(new_password, 12);
      db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, admin.id);

      audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_PASSWORD_CHANGED', ip_address: req.ip });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
);

module.exports = router;
