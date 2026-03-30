const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../db/setup');

const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ? AND is_active = 1').get(email);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: {
      id: admin.id,
      email: admin.email,
      role: 'ADMIN'
    }
  });
});

// POST /api/admin/auth/change-password
router.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'email, currentPassword, and newPassword are required' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare(`UPDATE admins SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, admin.id);

  res.json({ message: 'Password changed successfully' });
});

module.exports = router;