'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const { validationErrorHandler } = require('../../middleware/validate');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const search = req.query.search || '';
    const role = req.query.role || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const creatorParams = [];
    let creatorWhere = 'WHERE 1=1';
    if (search) {
      creatorWhere += ' AND (ca.email LIKE ? OR c.display_name LIKE ?)';
      creatorParams.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      creatorWhere += ' AND ca.role = ?';
      creatorParams.push(role);
    }
    const creators = db.prepare(
      `SELECT ca.id, ca.email, ca.role, ca.is_suspended, ca.is_email_verified, ca.created_at, c.display_name as name, 'creator' as type
       FROM creator_accounts ca
       JOIN creators c ON c.id = ca.creator_id
       ${creatorWhere}`
    ).all(...creatorParams);

    const bizParams = [];
    let bizWhere = 'WHERE 1=1';
    if (search) {
      bizWhere += ' AND (email LIKE ? OR company_name LIKE ?)';
      bizParams.push(`%${search}%`, `%${search}%`);
    }
    const businesses = db.prepare(
      `SELECT id, email, 'business' as role, is_suspended, is_email_verified, created_at, company_name as name, 'business' as type
       FROM businesses ${bizWhere}`
    ).all(...bizParams);

    const all = [...creators, ...businesses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = all.length;
    const sliced = all.slice(offset, offset + limit);
    return res.json({ success: true, data: { users: sliced, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:userId/suspend', requireAdmin, (req, res) => {
  try {
    const { user_type } = req.body;
    if (!['creator', 'business'].includes(user_type)) return res.status(400).json({ success: false, error: 'Invalid user_type.' });
    const table = user_type === 'creator' ? 'creator_accounts' : 'businesses';
    db.prepare(`UPDATE ${table} SET is_suspended = 1 WHERE id = ?`).run(req.params.userId);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_SUSPENDED', target_type: user_type, target_id: parseInt(req.params.userId), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:userId/reactivate', requireAdmin, (req, res) => {
  try {
    const { user_type } = req.body;
    if (!['creator', 'business'].includes(user_type)) return res.status(400).json({ success: false, error: 'Invalid user_type.' });
    const table = user_type === 'creator' ? 'creator_accounts' : 'businesses';
    db.prepare(`UPDATE ${table} SET is_suspended = 0 WHERE id = ?`).run(req.params.userId);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_REACTIVATED', target_type: user_type, target_id: parseInt(req.params.userId), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:userId/role', requireAdmin, [
  body('role').isIn(['creator', 'admin']).withMessage('Role must be creator or admin'),
], validationErrorHandler, (req, res) => {
  try {
    db.prepare('UPDATE creator_accounts SET role = ? WHERE id = ?').run(req.body.role, req.params.userId);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_ROLE_CHANGED', target_type: 'creator_account', target_id: parseInt(req.params.userId), metadata: { role: req.body.role }, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:userId/email-verify', requireAdmin, (req, res) => {
  try {
    const { user_type } = req.body;
    if (!['creator', 'business'].includes(user_type)) return res.status(400).json({ success: false, error: 'Invalid user_type.' });
    const table = user_type === 'creator' ? 'creator_accounts' : 'businesses';
    db.prepare(`UPDATE ${table} SET is_email_verified = 1 WHERE id = ?`).run(req.params.userId);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_EMAIL_VERIFIED', target_type: user_type, target_id: parseInt(req.params.userId), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reset-password', requireAdmin, (req, res) => {
  try {
    const { user_id, user_type } = req.body;
    if (!['creator', 'business'].includes(user_type)) return res.status(400).json({ success: false, error: 'Invalid user_type.' });
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) tempPassword += chars[Math.floor(Math.random() * chars.length)];
    const hash = bcrypt.hashSync(tempPassword, 12);
    const table = user_type === 'creator' ? 'creator_accounts' : 'businesses';
    db.prepare(`UPDATE ${table} SET password_hash = ? WHERE id = ?`).run(hash, user_id);
    logger.warn(`[ADMIN] Password reset for ${user_type} id=${user_id} — temp: ${tempPassword}`);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_PASSWORD_RESET', target_type: user_type, target_id: parseInt(user_id), ip_address: req.ip });
    return res.json({ success: true, data: { message: 'Password reset. Check server logs.' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
