const express = require('express');
const pool = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/queue
router.get('/', async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit) || 50, 1), 2000);
  const off = parseInt(offset) || 0;

  try {
    let query = 'SELECT * FROM moderation_queue WHERE 1=1';
    const params = [];
    let idx = 1;

    if (status) {
      query += ` AND status = $${idx}`;
      params.push(status);
      idx++;
    }

    query += ` ORDER BY submitted_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(lim, off);

    const { rows } = await pool.query(query, params);
    res.json({ data: rows, limit: lim, offset: off });
  } catch (err) {
    console.error('Queue list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];

    for (const id of ids) {
      const { rows } = await client.query('SELECT * FROM moderation_queue WHERE id = $1', [id]);
      const item = rows[0];
      if (!item) continue;

      if (action === 'delete') {
        await client.query('DELETE FROM moderation_queue WHERE id = $1', [id]);
        results.push({ id, result: 'deleted' });
      } else {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        await client.query(
          'UPDATE moderation_queue SET status = $1, reviewed_at = NOW() WHERE id = $2',
          [newStatus, id]
        );

        if (item.content_id) {
          const contentStatus = action === 'approve' ? 'published' : 'rejected';
          if (item.content_type === 'creator_content') {
            await client.query(
              'UPDATE content SET status = $1, updated_at = NOW() WHERE id = $2',
              [contentStatus, item.content_id]
            );
          }
          if (item.content_type === 'business_content') {
            await client.query(
              'UPDATE business_content SET status = $1, updated_at = NOW() WHERE id = $2',
              [contentStatus, item.content_id]
            );
          }
        }
        results.push({ id, result: newStatus });
      }

      await client.query(
        'INSERT INTO audit_log (action_type, actor, target) VALUES ($1, $2, $3)',
        [`QUEUE_${action.toUpperCase()}`, req.user.email, `queue:${id}`]
      );
    }

    const undoExpiresAt = new Date(Date.now() + 30 * 1000).toISOString();
    await client.query(
      `INSERT INTO bulk_action_log
        (admin, action_type, target_type, target_ids, previous_state, undo_window_expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        req.user.email,
        `QUEUE_${action.toUpperCase()}`,
        'moderation_queue',
        JSON.stringify(ids),
        JSON.stringify(results),
        undoExpiresAt
      ]
    );

    await client.query('COMMIT');
    res.json({ message: `Bulk ${action} complete`, results, undo_until: undoExpiresAt });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk action error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// POST /api/admin/queue/bulk-action/undo
router.post('/bulk-action/undo', async (req, res) => {
  const { log_id } = req.body;
  if (!log_id) return res.status(400).json({ error: 'log_id is required' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM bulk_action_log WHERE id = $1 AND undone_at IS NULL',
      [log_id]
    );
    const log = rows[0];
    if (!log) return res.status(404).json({ error: 'Bulk action log not found or already undone' });

    if (new Date() > new Date(log.undo_window_expires_at)) {
      return res.status(400).json({ error: 'Undo window has expired' });
    }

    const targetIds = JSON.parse(log.target_ids || '[]');
    const action = log.action_type.replace('QUEUE_', '').toLowerCase();

    if (action === 'delete') {
      return res.status(400).json({ error: 'Undo delete is not supported' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const qid of targetIds) {
        const { rows: itemRows } = await client.query('SELECT * FROM moderation_queue WHERE id = $1', [qid]);
        const item = itemRows[0];
        if (!item) continue;
        await client.query('UPDATE moderation_queue SET status = $1 WHERE id = $2', ['pending', qid]);
        if (item.content_id && item.content_type === 'creator_content') {
          await client.query('UPDATE content SET status = $1 WHERE id = $2', ['pending', item.content_id]);
        }
        if (item.content_id && item.content_type === 'business_content') {
          await client.query('UPDATE business_content SET status = $1 WHERE id = $2', ['pending', item.content_id]);
        }
      }

      await client.query('UPDATE bulk_action_log SET undone_at = NOW() WHERE id = $1', [log_id]);
      await client.query(
        'INSERT INTO audit_log (action_type, actor, target, reason) VALUES ($1, $2, $3, $4)',
        ['QUEUE_BULK_UNDO', req.user.email, `bulk:${log_id}`, `Undo bulk action ${action}`]
      );

      await client.query('COMMIT');
      res.json({ message: 'Bulk action undone' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Undo error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
