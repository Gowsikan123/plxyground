const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/queue - list moderation queue
router.get('/', (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 2000);
  const off = parseInt(offset) || 0;

  let query = `SELECT * FROM moderation_queue WHERE 1=1`;
  const params = [];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(lim, off);

  const rows = db.prepare(query).all(...params);
  res.json({ data: rows, limit: lim, offset: off });
});

// POST /api/admin/queue/bulk-action
router.post('/bulk-action', (req, res) => {
  const { action, ids } = req.body;

  if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'action and ids array are required' });
  }

  const allowed = ['approve', 'reject', 'delete'];
  if (!allowed.includes(action)) {
    return res.status(400).json({ error: 'action must be approve, reject, or delete' });
  }

  const results = [];

  for (const id of ids) {
    const item = db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(id);
    if (!item) continue;

    if (action === 'delete') {
      db.prepare('DELETE FROM moderation_queue WHERE id = ?').run(id);
      results.push({ id, result: 'deleted' });
    } else {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      db.prepare(`
        UPDATE moderation_queue SET status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(newStatus, id);

      if (action === 'approve' && item.entity_id) {
        if (item.type === 'content') {
          db.prepare(`
            UPDATE content SET
              is_published = 1,
              published_at = datetime('now'),
              feed_rank_at = datetime('now'),
              updated_at = datetime('now')
            WHERE id = ?
          `).run(item.entity_id);
        }

        if (item.type === 'opportunity') {
          db.prepare(`
            UPDATE opportunities SET
              is_published = 1,
              updated_at = datetime('now')
            WHERE id = ?
          `).run(item.entity_id);
        }
      }

      if (action === 'reject' && item.entity_id) {
        if (item.type === 'content') {
          db.prepare(`
            UPDATE content SET
              is_published = 0,
              updated_at = datetime('now')
            WHERE id = ?
          `).run(item.entity_id);
        }

        if (item.type === 'opportunity') {
          db.prepare(`
            UPDATE opportunities SET
              is_published = 0,
              updated_at = datetime('now')
            WHERE id = ?
          `).run(item.entity_id);
        }
      }

      results.push({ id, result: newStatus });
    }

    db.prepare(`
      INSERT INTO audit_log (action_type, actor, target)
      VALUES (?, ?, ?)
    `).run(
      `QUEUE_${action.toUpperCase()}`,
      req.user.email,
      `queue:${id}`
    );
  }

  res.json({ message: `Bulk ${action} complete`, results });
});

module.exports = router;
