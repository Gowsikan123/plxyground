'use strict';
const express = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const auditLogger = require('../../utils/auditLogger');

const router = express.Router();

// GET /api/admin/users
router.get('/', requireAdmin, (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    let creatorSql = `SELECT ca.id, ca.email, c.display_name AS name, ca.role, ca.is_suspended, ca.is_email_verified, ca.created_at, 'creator' AS user_type
      FROM creator_accounts ca JOIN creators c ON c.id = ca.creator_id WHERE 1=1`;
    let bizSql = `SELECT id, email, company_name AS name, 'business' AS role, is_suspended, is_email_verified, created_at, 'business' AS user_type
      FROM businesses WHERE 1=1`;
    const params = [];
    if (search) {
      creatorSql += ' AND (ca.email LIKE ? OR c.display_name LIKE ?)';
      bizSql += ' AND (email LIKE ? OR company_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const creators = db.prepare(creatorSql + ' LIMIT ? OFFSET ?').all(...params, limit, offset);
    const businesses = db.prepare(bizSql + ' LIMIT ? OFFSET ?').all(...params, limit, offset);
    return res.json({ success: true, data: { creators, businesses } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/users/:userId/suspend
router.post('/:userId/suspend', requireAdmin, (req, res) => {
  try {
    const { user_type } = req.body;
    if (user_type === 'creator') db.prepare('UPDATE creator_accounts SET is_suspended = 1 WHERE creator_id = ?').run(req.params.userId);
    else db.prepare('UPDATE businesses SET is_suspended = 1 WHERE id = ?').run(req.params.userId);
    auditLogger.log({ actor_type: 'admin', actor_id: req.admin.sub, action: 'USER_SUSPENDED', target_type: user_type, target_id: parseInt(req.params.userId, 10), ip_address: req.ip });
    return res.json({ success: true, data: { message: 'User suspended' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/users/:userId/reactivate
router.post('/:userId/reactivate', requireAdmin, (req, res) => {
  try {
    const { user_type } = req.body;
    if (user_type === 'creator') db.prepare('UPDATE creator_accounts SET is_suspended = 0 WHERE creator_id = ?').run(req.params.userId);
    else db.prepare('UPDATE businesses SET is_suspended = 0 WHERE id = ?').run(req.params.userId);
    auditLogger.log({ actor_type: 'admin', actor_id: req.admin.sub, action: 'USER_REACTIVATED', target_type: user_type, target_id: parseInt(req.params.userId, 10), ip_address: req.ip });
    return res.json({ success: true, data: { message: 'User reactivated' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/users/:userId/role
router.put('/:userId/role', requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    if (!['creator', 'admin'].includes(role)) return res.status(400).json({ success: false, error: 'Invalid role' });
    db.prepare('UPDATE creator_accounts SET role = ? WHERE creator_id = ?').run(role, req.params.userId);
    auditLogger.log({ actor_type: 'admin', actor_id: req.admin.sub, action: 'USER_ROLE_CHANGED', target_type: 'creator', target_id: parseInt(req.params.userId, 10), metadata: { role }, ip_address: req.ip });
    return res.json({ success: true, data: { message: 'Role updated' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/users/:userId/email-verify
router.put('/:userId/email-verify', requireAdmin, (req, res) => {
  try {
    const { user_type } = req.body;
    if (user_type === 'creator') db.prepare('UPDATE creator_accounts SET is_email_verified = 1 WHERE creator_id = ?').run(req.params.userId);
    else db.prepare('UPDATE businesses SET is_email_verified = 1 WHERE id = ?').run(req.params.userId);
    return res.json({ success: true, data: { message: 'Email verified' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/users/reset-password
router.post('/reset-password', requireAdmin, (req, res) => {
  const tempPassword = 'Temp' + Math.random().toString(36).slice(2, 10) + '!';
  console.info(`[DEV] Password reset for ${req.body.email}: ${tempPassword}`);
  return res.json({ success: true, data: { message: 'Password reset email sent (dev stub)', temp: tempPassword } });
});

module.exports = router;
