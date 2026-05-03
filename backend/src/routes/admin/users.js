'use strict';
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../../db/client');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');
const { requireAdmin } = require('../../middleware/auth');
const { validationErrorHandler } = require('../../middleware/validate');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    let crWhere = 'WHERE 1=1';
    let bizWhere = 'WHERE 1=1';
    const crParams = [];
    const bizParams = [];

    if (search) {
      crWhere += ' AND (ca.email LIKE ? OR c.display_name LIKE ? OR c.username LIKE ?)';
      crParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      bizWhere += ' AND (b.email LIKE ? OR b.company_name LIKE ?)';
      bizParams.push(`%${search}%`, `%${search}%`);
    }

    const creators = db.prepare(
      `SELECT ca.id, 'creator' as type, ca.email, ca.role, ca.is_suspended, ca.is_email_verified, ca.created_at,
       c.display_name as name, c.username, c.sport, c.avatar_url
       FROM creator_accounts ca JOIN creators c ON ca.creator_id = c.id ${crWhere}`
    ).all(...crParams);

    const businesses = db.prepare(
      `SELECT b.id, 'business' as type, b.email, 'business' as role, b.is_suspended, b.is_email_verified, b.created_at,
       b.company_name as name, b.slug as username, b.industry as sport, b.logo_url as avatar_url
       FROM businesses b ${bizWhere}`
    ).all(...bizParams);

    const all = [...creators, ...businesses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = all.length;
    const paged = all.slice(offset, offset + limit);

    return res.json({ success: true, data: { users: paged, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:userId/suspend', requireAdmin, [
  body('user_type').isIn(['creator', 'business']).withMessage('user_type must be creator or business'),
], validationErrorHandler, (req, res) => {
  try {
    const { user_type } = req.body;
    const table = user_type === 'business' ? 'businesses' : 'creator_accounts';
    const row = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(req.params.userId);
    if (!row) return res.status(404).json({ success: false, error: 'User not found' });
    db.prepare(`UPDATE ${table} SET is_suspended = 1 WHERE id = ?`).run(req.params.userId);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_SUSPENDED', target_type: user_type, target_id: parseInt(req.params.userId), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:userId/reactivate', requireAdmin, [
  body('user_type').isIn(['creator', 'business']).withMessage('user_type must be creator or business'),
], validationErrorHandler, (req, res) => {
  try {
    const { user_type } = req.body;
    const table = user_type === 'business' ? 'businesses' : 'creator_accounts';
    const row = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(req.params.userId);
    if (!row) return res.status(404).json({ success: false, error: 'User not found' });
    db.prepare(`UPDATE ${table} SET is_suspended = 0 WHERE id = ?`).run(req.params.userId);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_REACTIVATED', target_type: user_type, target_id: parseInt(req.params.userId), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:userId/role', requireAdmin, [
  body('role').isIn(['creator', 'admin']).withMessage('role must be creator or admin'),
], validationErrorHandler, (req, res) => {
  try {
    const row = db.prepare('SELECT id FROM creator_accounts WHERE id = ?').get(req.params.userId);
    if (!row) return res.status(404).json({ success: false, error: 'Creator account not found' });
    db.prepare('UPDATE creator_accounts SET role = ? WHERE id = ?').run(req.body.role, req.params.userId);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_ROLE_CHANGED', target_type: 'creator', target_id: parseInt(req.params.userId), metadata: { role: req.body.role }, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:userId/email-verify', requireAdmin, [
  body('user_type').isIn(['creator', 'business']).withMessage('user_type required'),
], validationErrorHandler, (req, res) => {
  try {
    const { user_type } = req.body;
    const table = user_type === 'business' ? 'businesses' : 'creator_accounts';
    const row = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(req.params.userId);
    if (!row) return res.status(404).json({ success: false, error: 'User not found' });
    db.prepare(`UPDATE ${table} SET is_email_verified = 1 WHERE id = ?`).run(req.params.userId);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_EMAIL_VERIFIED', target_type: user_type, target_id: parseInt(req.params.userId), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reset-password', requireAdmin, [
  body('user_id').isInt().withMessage('user_id required'),
  body('user_type').isIn(['creator', 'business']).withMessage('user_type required'),
], validationErrorHandler, (req, res) => {
  try {
    const { user_id, user_type } = req.body;
    const table = user_type === 'business' ? 'businesses' : 'creator_accounts';
    const row = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(user_id);
    if (!row) return res.status(404).json({ success: false, error: 'User not found' });

    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    let tempPass = '';
    for (let i = 0; i < 12; i++) tempPass += chars[Math.floor(Math.random() * chars.length)];

    const hash = bcrypt.hashSync(tempPass, 12);
    db.prepare(`UPDATE ${table} SET password_hash = ? WHERE id = ?`).run(hash, user_id);
    logger.warn(`[ADMIN] Temp password for ${user_type} #${user_id}: ${tempPass}`);

    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'USER_PASSWORD_RESET', target_type: user_type, target_id: user_id, ip_address: req.ip });
    return res.json({ success: true, data: { message: 'Password reset. Check server logs.' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
