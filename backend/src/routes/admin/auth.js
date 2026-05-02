'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const router = express.Router();

const db = require('../../db/client');
const { signAccessToken } = require('../../utils/jwt');
const auditLog = require('../../utils/auditLogger');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');
const config = require('../../config');
const logger = require('../../logger');

// POST /api/admin/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const { rows } = await db.query(
        `SELECT id, email, username, password_hash, role FROM users WHERE email = $1 AND role = 'admin'`,
        [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

      const admin = rows[0];
      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      const accessToken = signAccessToken({ sub: admin.id, role: admin.role, type: 'creator' });
      delete admin.password_hash;

      auditLog({ actorId: admin.id, actorType: 'admin', action: 'admin.login', ip: req.ip });
      res.json({ admin, accessToken });
    } catch (err) {
      logger.error('admin.auth.login error', { message: err.message });
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/admin/auth/change-password
router.post(
  '/change-password',
  requireAuth,
  requireAdmin,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 8 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);

      const match = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!match) return res.status(401).json({ error: 'Current password incorrect' });

      const newHash = await bcrypt.hash(new_password, config.bcrypt.rounds);
      await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);

      auditLog({ actorId: req.user.id, actorType: 'admin', action: 'admin.password.changed', ip: req.ip });
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      logger.error('admin.auth.changePassword error', { message: err.message });
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

module.exports = router;
