'use strict';

const router = require('express').Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');

// POST /api/admin/auth/login
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { email, password } = req.body;

  try {
    const { rows } = await db.query(
      'SELECT id, email, password_hash, role FROM admins WHERE email = $1',
      [email]
    );

    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: admin.id, role: 'admin', adminRole: admin.role });
    const { password_hash: _, ...safeAdmin } = admin;

    audit(admin.id, 'admin', 'admin.login', { email });
    logger.info('Admin logged in', { id: admin.id, email });

    return res.json({ token, admin: safeAdmin });
  } catch (err) {
    logger.error('Admin login error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/auth/me
router.get('/me', requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, email, role, created_at FROM admins WHERE id = $1',
      [req.user.sub]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Admin not found' });
    return res.json({ admin: rows[0] });
  } catch (err) {
    logger.error('Admin /me error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/auth/change-password
router.post('/change-password', requireAdmin, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { current_password, new_password } = req.body;

  try {
    const { rows } = await db.query('SELECT password_hash FROM admins WHERE id = $1', [req.user.sub]);
    if (rows.length === 0) return res.status(404).json({ error: 'Admin not found' });

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    const new_hash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [new_hash, req.user.sub]);

    audit(req.user.sub, 'admin', 'admin.change_password', {});
    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error('Admin change-password error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
