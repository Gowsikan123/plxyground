'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../../db/client');
const audit = require('../../utils/auditLogger');
const { requireAdmin } = require('../../middleware/auth');
const { validationErrorHandler } = require('../../middleware/validate');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const content_type = req.query.content_type || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    let where = 'WHERE mq.status = ?';
    const params = [status];
    if (content_type) {
      where += ' AND mq.content_type = ?';
      params.push(content_type);
    }

    const rows = db
      .prepare(
        `SELECT mq.*, 
          CASE WHEN mq.content_type = 'creator_content' THEN c.title ELSE bc.title END as content_title,
          CASE WHEN mq.content_type = 'creator_content' THEN cr.display_name ELSE b.company_name END as author_name
        FROM moderation_queue mq
        LEFT JOIN content c ON mq.content_type = 'creator_content' AND mq.content_id = c.id
        LEFT JOIN creators cr ON c.creator_id = cr.id
        LEFT JOIN business_content bc ON mq.content_type = 'business_content' AND mq.content_id = bc.id
        LEFT JOIN businesses b ON bc.business_id = b.id
        ${where}
        ORDER BY mq.submitted_at DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) as n FROM moderation_queue mq ${where}`).get(...params).n;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/bulk-action',
  requireAdmin,
  [
    body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
    body('action').isIn(['approve', 'reject', 'delete']).withMessage('action must be approve, reject, or delete'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const { ids, action, note = '' } = req.body;

      const process = db.transaction(() => {
        for (const id of ids) {
          const item = db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(id);
          if (!item) continue;

          let queueStatus, contentStatus;
          if (action === 'approve') { queueStatus = 'approved'; contentStatus = 'published'; }
          else if (action === 'reject') { queueStatus = 'rejected'; contentStatus = 'rejected'; }
          else { queueStatus = 'rejected'; contentStatus = 'deleted'; }

          db.prepare('UPDATE moderation_queue SET status=?, reviewed_by=?, review_note=?, reviewed_at=CURRENT_TIMESTAMP WHERE id=?')
            .run(queueStatus, req.admin.id, note, id);

          const table = item.content_type === 'creator_content' ? 'content' : 'business_content';
          db.prepare(`UPDATE ${table} SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(contentStatus, item.content_id);

          audit.log({
            actor_type: 'admin',
            actor_id: req.admin.id,
            action: `QUEUE_${action.toUpperCase()}`,
            target_type: item.content_type,
            target_id: item.content_id,
            metadata: { queue_id: id, note },
            ip_address: req.ip,
          });
        }
      });

      process();
      return res.json({ success: true, data: { processed: ids.length } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
