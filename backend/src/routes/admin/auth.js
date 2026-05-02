'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { getPool } = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../logger');

const router = express.Router();

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    const pool = getPool();
    const { email, password } = req.body;
    try {
      const { rows } = await pool.query(
        `SELECT * FROM admin_accounts WHERE email = $1 AND is_active = true`,
        [email]
      );
      if (rows.length === 0) {
        logger.warn(`Admin login attempt with unknown email: ${email} from ${req.ip}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const admin = rows[0];
      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) {
        logger.warn(`Failed admin login for ${email} from ${req.ip}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      await pool.query(`UPDATE admin_accounts SET last_login = NOW() WHERE id = $1`, [admin.id]);
      const token = signToken({ sub: admin.id, type: 'admin', role: admin.role });
      auditLogger.log({ actor_type: 'admin', actor_id: admin.id, action: 'ADMIN_LOGIN', ip_address: req.ip });
      return res.json({
        token,
        admin: { id: admin.id, email: admin.email, role: admin.role },
      });
    } catch (err) {
      throw err;
    }
  }
);

router.get('/me', requireAdmin, async (req, res) => {
  return res.json({ admin: req.user });
});

router.put('/change-password', requireAdmin, [
  body('current_password').notEmpty().withMessage('Current password required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
], validate, async (req, res) => {
  const pool = getPool();
  const { current_password, new_password } = req.body;
  try {
    const { rows } = await pool.query(`SELECT * FROM admin_accounts WHERE id = $1`, [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
    const admin = rows[0];
    const valid = await bcrypt.compare(current_password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = await bcrypt.hash(new_password, 12);
    await pool.query(`UPDATE admin_accounts SET password_hash = $1 WHERE id = $2`, [newHash, admin.id]);
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'ADMIN_PASSWORD_CHANGED', ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
