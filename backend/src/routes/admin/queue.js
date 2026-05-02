'use strict';
const express = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const auditLogger = require('../../utils/auditLogger');

const router = express.Router();

// GET /api/admin/queue
router.get('/', requireAdmin, (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const rows = db.prepare(`
      SELECT mq.*,
        CASE mq.content_type
          WHEN 'creator_content' THEN (SELECT title FROM content WHERE id = mq.content_id)
          WHEN 'business_content' THEN (SELECT title FROM business_content WHERE id = mq.content_id)
        END AS content_title
      FROM moderation_queue mq
      WHERE mq.status = ?
      ORDER BY mq.submitted_at DESC
      LIMIT ? OFFSET ?
    `).all(status, limit, offset);
    const total = db.prepare('SELECT COUNT(*) as c FROM moderation_queue WHERE status = ?').get(status).c;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/queue/bulk-action
router.post('/bulk-action', requireAdmin, (req, res) => {
  try {
    const { ids, action, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: 'ids must be a non-empty array' });
    if (!['approve', 'reject', 'delete'].includes(action)) return res.status(400).json({ success: false, error: 'Invalid action' });

    const statusMap = { approve: 'approved', reject: 'rejected', delete: 'rejected' };
    const qStatus = statusMap[action];

    const updateQueue = db.prepare(`
      UPDATE moderation_queue
      SET status = ?, reviewed_by = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const updateCreatorContent = db.prepare(`UPDATE content SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    const updateBizContent = db.prepare(`UPDATE business_content SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);

    const doAll = db.transaction((qIds) => {
      for (const qId of qIds) {
        const item = db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(qId);
        if (!item) continue;
        updateQueue.run(qStatus, req.admin.sub, note || null, qId);
        const contentStatus = action === 'approve' ? 'published' : (action === 'delete' ? 'deleted' : 'rejected');
        if (item.content_type === 'creator_content') {
          updateCreatorContent.run(contentStatus, item.content_id);
        } else {
          updateBizContent.run(contentStatus, item.content_id);
        }
      }
    });
    doAll(ids);

    auditLogger.log({
      actor_type: 'admin',
      actor_id: req.admin.sub,
      action: `QUEUE_BULK_${action.toUpperCase()}`,
      target_type: 'moderation_queue',
      metadata: { ids, note },
      ip_address: req.ip,
    });

    return res.json({ success: true, data: { message: `${ids.length} items ${action}d` } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
