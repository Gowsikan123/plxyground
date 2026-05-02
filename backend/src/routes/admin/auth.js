'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const { getPool } = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { writeAudit } = require('../../utils/auditLogger');
const { validate } = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');
const { bcryptRounds } = require('../../config');
const logger = require('../../logger');

const router = express.Router();

// POST /api/admin/auth/login
router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const { rows } = await getPool().query('SELECT * FROM admins WHERE email = $1', [email]);
      const admin = rows[0];
      if (!admin || !admin.is_active) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signToken({ id: admin.id, role: admin.role }, 'admin');
      writeAudit({ actorId: admin.id, actorType: 'admin', action: 'admin_login', ip: req.ip });

      const { password_hash, ...safe } = admin;
      return res.json({ token, admin: safe });
    } catch (err) {
      logger.error('admin login error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/admin/auth/me
router.get('/me', requireAdmin, async (req, res) => {
  return res.json({ admin: req.admin });
});

// PATCH /api/admin/auth/password
router.patch(
  '/password',
  requireAdmin,
  [body('current_password').notEmpty(), body('new_password').isLength({ min: 8 })],
  validate,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const { rows } = await getPool().query('SELECT password_hash FROM admins WHERE id = $1', [req.admin.id]);
      const valid = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

      const hash = await bcrypt.hash(new_password, bcryptRounds);
      await getPool().query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, req.admin.id]);
      writeAudit({ actorId: req.admin.id, actorType: 'admin', action: 'change_password', ip: req.ip });
      return res.json({ success: true });
    } catch (err) {
      logger.error('admin change password error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
