'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const pool = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');
const audit = require('../../utils/auditLogger');

const router = express.Router();

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
      const result = await pool.query('SELECT * FROM admins WHERE email=$1', [email]);
      if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const admin = result.rows[0];
      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
      const token = signToken({ sub: admin.id, type: 'admin' });
      await audit.log({ actor_type: 'admin', actor_id: admin.id, action: 'ADMIN_LOGIN', ip_address: req.ip });
      return res.json({ token, admin: { id: admin.id, email: admin.email } });
    } catch {
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

module.exports = router;
