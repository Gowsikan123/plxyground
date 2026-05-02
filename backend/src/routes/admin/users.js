'use strict';
const { Router } = require('express');
const { query } = require('express-validator');
const db = require('../../db/client');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { logAudit } = require('../../utils/auditLogger');
const logger = require('../../logger');

const router = Router();
const adminOnly = requireAuth('admin');

router.get('/', adminOnly, [
  query('type').optional().isIn(['creators', 'businesses']),
  query('page').optional().isInt({ min: 1 }),
], validate, (req, res) => {
  try {
    const type = req.query.type || 'creators';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const table = type === 'creators' ? 'creators' : 'businesses';
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
    const total = db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get();
    res.json({ data: rows, meta: { page, limit, total: total.n } });
  } catch (err) {
    logger.error('Admin users list error', { message: err.message });
    res.status(500).json({ error: 'Could not load users.' });
  }
});

router.post('/creators/:id/suspend', adminOnly, (req, res) => {
  try {
    const account = db.prepare('SELECT * FROM creator_accounts WHERE creator_id = ?').get(req.params.id);
    if (!account) return res.status(404).json({ error: 'Creator not found.' });
    db.prepare('UPDATE creator_accounts SET is_suspended = 1 WHERE creator_id = ?').run(req.params.id);
    logAudit({ actorType: 'admin', actorId: req.user.id, action: 'creator_suspended', targetType: 'creator', targetId: parseInt(req.params.id, 10), ipAddress: req.ip });
    res.json({ message: 'Creator suspended.' });
  } catch (err) {
    logger.error('Suspend creator error', { message: err.message });
    res.status(500).json({ error: 'Could not suspend.' });
  }
});

router.post('/creators/:id/unsuspend', adminOnly, (req, res) => {
  try {
    db.prepare('UPDATE creator_accounts SET is_suspended = 0 WHERE creator_id = ?').run(req.params.id);
    logAudit({ actorType: 'admin', actorId: req.user.id, action: 'creator_unsuspended', targetType: 'creator', targetId: parseInt(req.params.id, 10), ipAddress: req.ip });
    res.json({ message: 'Creator unsuspended.' });
  } catch (err) {
    logger.error('Unsuspend creator error', { message: err.message });
    res.status(500).json({ error: 'Could not unsuspend.' });
  }
});

router.post('/businesses/:id/suspend', adminOnly, (req, res) => {
  try {
    const biz = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
    if (!biz) return res.status(404).json({ error: 'Business not found.' });
    db.prepare('UPDATE businesses SET is_suspended = 1 WHERE id = ?').run(req.params.id);
    logAudit({ actorType: 'admin', actorId: req.user.id, action: 'business_suspended', targetType: 'business', targetId: parseInt(req.params.id, 10), ipAddress: req.ip });
    res.json({ message: 'Business suspended.' });
  } catch (err) {
    logger.error('Suspend business error', { message: err.message });
    res.status(500).json({ error: 'Could not suspend.' });
  }
});

module.exports = router;
