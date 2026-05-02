'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../../db/client');
const { signToken } = require('../../utils/jwt');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE email=$1 LIMIT 1', [email]);
    if (!result.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ sub: admin.id, email: admin.email, type: 'admin' });

    await audit.log({
      actor_type: 'admin',
      actor_id: admin.id,
      action: 'ADMIN_LOGIN',
      ip_address: req.ip,
    });

    return res.json({
      token,
      user: { id: admin.id, email: admin.email, role: 'ADMIN' },
    });
  } catch {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/admin/auth/change-password
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const result = await pool.query('SELECT * FROM admins WHERE id=$1 LIMIT 1', [req.admin.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const admin = result.rows[0];
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE admins SET password_hash=$1 WHERE id=$2', [hash, admin.id]);

    await audit.log({
      actor_type: 'admin',
      actor_id: admin.id,
      action: 'ADMIN_PASSWORD_CHANGED',
      ip_address: req.ip,
    });

    return res.json({ message: 'Password changed successfully' });
  } catch {
    return res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;
