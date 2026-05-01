const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/queue - list moderation queue
router.get('/', async (req, res) => {
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

  const rows = await db.prepare(query).all(...params);
  res.json({ data: rows, limit: lim, offset: off });
});

// POST /api/admin/queue/bulk-action
router.post('/bulk-action', async (req, res) => {
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
    const item = await db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(id);
    if (!item) continue;

    if (action === 'delete') {
      await db.prepare('DELETE FROM moderation_queue WHERE id = ?').run(id);
      results.push({ id, result: 'deleted' });
    } else {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      await db.prepare(`
        UPDATE moderation_queue SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(newStatus, id);

      if (action === 'approve' && item.entity_id) {
        if (item.type === 'content') {
          await db.prepare(`
            UPDATE content SET
              is_published = 1,
              published_at = CURRENT_TIMESTAMP,
              feed_rank_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(item.entity_id);
        }

        if (item.type === 'opportunity') {
          await db.prepare(`
            UPDATE opportunities SET
              is_published = 1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(item.entity_id);
        }
      }

      if (action === 'reject' && item.entity_id) {
        if (item.type === 'content') {
          await db.prepare(`
            UPDATE content SET
              is_published = 0,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(item.entity_id);
        }

        if (item.type === 'opportunity') {
          await db.prepare(`
            UPDATE opportunities SET
              is_published = 0,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(item.entity_id);
        }
      }

      results.push({ id, result: newStatus });
    }

    await db.prepare(`
      INSERT INTO audit_log (action_type, actor, target)
      VALUES (?, ?, ?)
    `).run(
      `QUEUE_${action.toUpperCase()}`,
      req.user.email,
      `queue:${id}`
    );
  }

  const now = new Date().toISOString();
  const undoExpiresAt = new Date(Date.now() + 30 * 1000).toISOString();
  await db.prepare(`
    INSERT INTO bulk_action_log (admin, action_type, target_type, target_ids, previous_state, undo_window_expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.email,
    `QUEUE_${action.toUpperCase()}`,
    'moderation_queue',
    JSON.stringify(ids),
    JSON.stringify(results),
    undoExpiresAt,
    now
  );

  res.json({ message: `Bulk ${action} complete`, results, undo_until: undoExpiresAt });
});

// POST /api/admin/queue/bulk-action/undo
router.post('/bulk-action/undo', async (req, res) => {
  const { log_id } = req.body;
  if (!log_id) {
    return res.status(400).json({ error: 'log_id is required' });
  }

  const log = await db.prepare('SELECT * FROM bulk_action_log WHERE id = ? AND undone_at IS NULL').get(log_id);
  if (!log) {
    return res.status(404).json({ error: 'Bulk action log not found or already undone' });
  }

  if (new Date() > new Date(log.undo_window_expires_at)) {
    return res.status(400).json({ error: 'Undo window has expired' });
  }

  const targetIds = JSON.parse(log.target_ids || '[]');
  const action = log.action_type.replace('QUEUE_', '').toLowerCase();

  if (action === 'approve') {
    for (const qid of targetIds) {
      const item = await db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(qid);
      if (!item) continue;
      await db.prepare('UPDATE moderation_queue SET status = ? WHERE id = ?').run('pending', qid);
      if (item.entity_id && item.type === 'content') {
        await db.prepare('UPDATE content SET is_published = 0 WHERE id = ?').run(item.entity_id);
      }
      if (item.entity_id && item.type === 'opportunity') {
        await db.prepare('UPDATE opportunities SET is_published = 0 WHERE id = ?').run(item.entity_id);
      }
    }
  }

  if (action === 'reject') {
    // undo reject returns to pending
    for (const qid of targetIds) {
      await db.prepare('UPDATE moderation_queue SET status = ? WHERE id = ?').run('pending', qid);
    }
  }

  if (action === 'delete') {
    return res.status(400).json({ error: 'Undo delete is not supported' });
  }

  await db.prepare('UPDATE bulk_action_log SET undone_at = CURRENT_TIMESTAMP WHERE id = ?').run(log_id);
  await db.prepare('INSERT INTO audit_log (action_type, actor, target, reason) VALUES (?, ?, ?, ?)').run(
    'QUEUE_BULK_UNDO',
    req.user.email,
    `bulk:${log_id}`,
    `Undo bulk action ${action}`
  );

  res.json({ message: 'Bulk action undone' });
});

module.exports = router;
