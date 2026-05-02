'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { validate } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../utils/auditLogger');
const logger = require('../../logger');

// POST /api/admin/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await db.query(
        'SELECT id, username, email, password_hash, role, is_active FROM admins WHERE email = $1',
        [email],
      );
      const admin = result.rows[0];

      if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!admin.is_active) {
        return res.status(403).json({ error: 'Account deactivated' });
      }

      await db.query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);
      const token = signToken({ id: admin.id, username: admin.username, role: admin.role, type: 'admin' }, true);

      auditLog({ actorId: admin.id, actorType: 'admin', action: 'admin.login', ip: req.ip });
      return res.json({ token, admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role } });
    } catch (err) {
      logger.error('admin.login error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/admin/auth/me
router.get('/me', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, role, last_login_at FROM admins WHERE id = $1',
      [req.admin.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Admin not found' });
    return res.json({ admin: result.rows[0] });
  } catch (err) {
    logger.error('admin.me error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
