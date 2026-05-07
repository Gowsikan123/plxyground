'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const sql = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { requireAdmin } = require('../../middleware/auth');
const { validationErrorHandler } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

// POST /api/admin/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const rows = await sql`SELECT * FROM admin_users WHERE email = ${email} LIMIT 1`;
      const admin = rows[0];
      if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      const token = signToken({ sub: admin.id, type: 'admin' });
      return res.json({
        success: true,
        token,
        admin: { id: admin.id, email: admin.email, username: admin.username || admin.email, role: 'admin' },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/admin/auth/me
router.get('/me', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT id, email, username, created_at FROM admin_users WHERE id = ${req.admin.id}`;
    const admin = rows[0];
    if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });
    return res.json({
      success: true,
      admin: { id: admin.id, email: admin.email, username: admin.username || admin.email, role: 'admin' },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/auth/change-password
router.post(
  '/change-password',
  requireAdmin,
  [
    body('current_password').notEmpty().withMessage('Current password required'),
    body('new_password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Must contain uppercase')
      .matches(/[0-9]/).withMessage('Must contain digit'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const rows = await sql`SELECT * FROM admin_users WHERE id = ${req.admin.id}`;
      const admin = rows[0];

      const valid = await bcrypt.compare(current_password, admin.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Current password is incorrect' });

      const newHash = await bcrypt.hash(new_password, 12);
      await sql`UPDATE admin_users SET password_hash = ${newHash} WHERE id = ${admin.id}`;
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
