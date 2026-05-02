'use strict';
const { Router } = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const contentType = req.query.content_type || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const params = [status];
    let where = 'WHERE mq.status = ?';
    if (contentType) {
      where += ' AND mq.content_type = ?';
      params.push(contentType);
    }

    const rows = db.prepare(
      `SELECT mq.*,
        CASE WHEN mq.content_type = 'creator_content'
             THEN (SELECT c.title FROM content c WHERE c.id = mq.content_id)
             ELSE (SELECT bc.title FROM business_content bc WHERE bc.id = mq.content_id)
        END as content_title,
        CASE WHEN mq.content_type = 'creator_content'
             THEN (SELECT cr.display_name FROM content c JOIN creators cr ON cr.id = c.creator_id WHERE c.id = mq.content_id)
             ELSE (SELECT b.company_name FROM business_content bc JOIN businesses b ON b.id = bc.business_id WHERE bc.id = mq.content_id)
        END as poster_name
       FROM moderation_queue mq
       ${where}
       ORDER BY mq.submitted_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM moderation_queue mq ${where}`).get(...params).count;
    return res.json({ success: true, data: { queue: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/bulk-action', requireAdmin, (req, res) => {
  try {
    const { ids, action, note = '' } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: 'ids must be a non-empty array.' });
    if (!['approve', 'reject', 'delete'].includes(action)) return res.status(400).json({ success: false, error: 'Invalid action.' });

    const transact = db.transaction(() => {
      for (const id of ids) {
        const queueItem = db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(id);
        if (!queueItem) continue;

        const now = new Date().toISOString();
        if (action === 'approve') {
          db.prepare('UPDATE moderation_queue SET status=?,reviewed_by=?,reviewed_at=?,review_note=? WHERE id=?')
            .run('approved', req.admin.id, now, note, id);
          const table = queueItem.content_type === 'creator_content' ? 'content' : 'business_content';
          db.prepare(`UPDATE ${table} SET status='published', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(queueItem.content_id);
        } else if (action === 'reject') {
          db.prepare('UPDATE moderation_queue SET status=?,reviewed_by=?,reviewed_at=?,review_note=? WHERE id=?')
            .run('rejected', req.admin.id, now, note, id);
          const table = queueItem.content_type === 'creator_content' ? 'content' : 'business_content';
          db.prepare(`UPDATE ${table} SET status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(queueItem.content_id);
        } else if (action === 'delete') {
          db.prepare('UPDATE moderation_queue SET status=?,reviewed_by=?,reviewed_at=?,review_note=? WHERE id=?')
            .run('rejected', req.admin.id, now, note, id);
          const table = queueItem.content_type === 'creator_content' ? 'content' : 'business_content';
          db.prepare(`UPDATE ${table} SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(queueItem.content_id);
        }
        audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: `QUEUE_${action.toUpperCase()}`, target_type: queueItem.content_type, target_id: queueItem.content_id, metadata: { note }, ip_address: req.ip });
      }
    });
    transact();
    return res.json({ success: true, data: { processed: ids.length } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
