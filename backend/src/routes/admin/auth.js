'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const db = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const validate = require('../../middleware/validate');
const { requireAdmin } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const token = signToken({ sub: admin.id, type: 'admin' });
    return res.json({ success: true, data: { token, admin: { id: admin.id, email: admin.email } } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/auth/change-password
router.post('/change-password', requireAdmin, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }),
], validate, async (req, res) => {
  try {
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.sub);
    const match = await bcrypt.compare(req.body.current_password, admin.password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Current password incorrect' });
    const hash = await bcrypt.hash(req.body.new_password, 12);
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, admin.id);
    return res.json({ success: true, data: { message: 'Password updated' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
