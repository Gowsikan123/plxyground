'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');
const { logAudit } = require('../../utils/auditLogger');
const logger = require('../../logger');

const router = Router();

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) return res.status(401).json({ error: 'Invalid credentials.' });
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });
    const token = signToken({ id: admin.id, role: 'admin', email: admin.email });
    logAudit({ actorType: 'admin', actorId: admin.id, action: 'admin_login', ipAddress: req.ip });
    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    logger.error('Admin login error', { message: err.message });
    res.status(500).json({ error: 'Login failed.' });
  }
});

module.exports = router;
