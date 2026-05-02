const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: admin.id, email: admin.email, role: 'ADMIN' }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/auth/change-password
router.post('/change-password', requireAuth, requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const email = req.user.email;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = rows[0];
    if (!admin) return res.status(401).json({ error: 'Admin not found' });

    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, admin.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
