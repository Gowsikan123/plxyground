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
  query('status').optional().isIn(['pending', 'published', 'rejected', 'deleted']),
  query('type').optional().isIn(['creator_content', 'business_content']),
  query('page').optional().isInt({ min: 1 }),
], validate, (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'published';
    const type = req.query.type || 'creator_content';
    const table = type === 'creator_content' ? 'content' : 'business_content';
    const rows = db.prepare(`SELECT * FROM ${table} WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(status, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) as n FROM ${table} WHERE status = ?`).get(status);
    res.json({ data: rows, meta: { page, limit, total: total.n } });
  } catch (err) {
    logger.error('Admin content list error', { message: err.message });
    res.status(500).json({ error: 'Could not load content.' });
  }
});

router.delete('/:type/:id', adminOnly, (req, res) => {
  try {
    const { type, id } = req.params;
    if (!['creator_content', 'business_content'].includes(type)) {
      return res.status(400).json({ error: 'Invalid content type.' });
    }
    const table = type === 'creator_content' ? 'content' : 'business_content';
    const row = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ error: 'Content not found.' });
    db.prepare(`UPDATE ${table} SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    logAudit({ actorType: 'admin', actorId: req.user.id, action: 'admin_content_deleted', targetType: type, targetId: parseInt(id, 10), ipAddress: req.ip });
    res.json({ message: 'Content deleted.' });
  } catch (err) {
    logger.error('Admin content delete error', { message: err.message });
    res.status(500).json({ error: 'Could not delete.' });
  }
});

module.exports = router;
