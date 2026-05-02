'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { validationErrorHandler } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');
const audit = require('../../utils/auditLogger');

const router = Router();

router.post(
  '/login',
  authLimiter,
  [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
      if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
      const valid = bcrypt.compareSync(password, admin.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
      const token = signToken({ sub: admin.id, type: 'admin' });
      audit.log({ actor_type: 'admin', actor_id: admin.id, action: 'ADMIN_LOGIN', ip_address: req.ip });
      return res.json({ success: true, data: { token, admin: { id: admin.id, email: admin.email } } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.post(
  '/change-password',
  requireAdmin,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Must contain uppercase')
      .matches(/[0-9]/).withMessage('Must contain digit'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
      const valid = bcrypt.compareSync(current_password, admin.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
      const newHash = bcrypt.hashSync(new_password, 12);
      db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, admin.id);
      audit.log({ actor_type: 'admin', actor_id: admin.id, action: 'ADMIN_PASSWORD_CHANGED', ip_address: req.ip });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
