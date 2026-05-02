'use strict';
const { Router } = require('express');
const { body, query } = require('express-validator');
const db = require('../../db/client');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const { logAudit } = require('../../utils/auditLogger');
const logger = require('../../logger');

const router = Router();
const adminOnly = requireAuth('admin');

router.get('/', adminOnly, [
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('page').optional().isInt({ min: 1 }),
], validate, (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const rows = db.prepare(
      'SELECT * FROM moderation_queue WHERE status = ? ORDER BY submitted_at ASC LIMIT ? OFFSET ?'
    ).all(status, limit, offset);
    const total = db.prepare('SELECT COUNT(*) as n FROM moderation_queue WHERE status = ?').get(status);
    res.json({ data: rows, meta: { page, limit, total: total.n } });
  } catch (err) {
    logger.error('Queue list error', { message: err.message });
    res.status(500).json({ error: 'Could not load queue.' });
  }
});

router.post('/:id/approve', adminOnly, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM moderation_queue WHERE id = ? AND status = ?').get(req.params.id, 'pending');
    if (!item) return res.status(404).json({ error: 'Queue item not found.' });
    const table = item.content_type === 'creator_content' ? 'content' : 'business_content';
    db.prepare(`UPDATE ${table} SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(item.content_id);
    db.prepare('UPDATE moderation_queue SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', req.user.id, item.id);
    logAudit({ actorType: 'admin', actorId: req.user.id, action: 'content_approved', targetType: item.content_type, targetId: item.content_id, ipAddress: req.ip });
    res.json({ message: 'Content approved.' });
  } catch (err) {
    logger.error('Queue approve error', { message: err.message });
    res.status(500).json({ error: 'Could not approve.' });
  }
});

router.post('/:id/reject', adminOnly, [
  body('note').optional().trim(),
], validate, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM moderation_queue WHERE id = ? AND status = ?').get(req.params.id, 'pending');
    if (!item) return res.status(404).json({ error: 'Queue item not found.' });
    const table = item.content_type === 'creator_content' ? 'content' : 'business_content';
    db.prepare(`UPDATE ${table} SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(item.content_id);
    db.prepare('UPDATE moderation_queue SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run('rejected', req.body.note || '', req.user.id, item.id);
    logAudit({ actorType: 'admin', actorId: req.user.id, action: 'content_rejected', targetType: item.content_type, targetId: item.content_id, metadata: { note: req.body.note }, ipAddress: req.ip });
    res.json({ message: 'Content rejected.' });
  } catch (err) {
    logger.error('Queue reject error', { message: err.message });
    res.status(500).json({ error: 'Could not reject.' });
  }
});

module.exports = router;
