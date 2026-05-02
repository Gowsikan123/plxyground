'use strict';

const express = require('express');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const auditLogger = require('../../utils/auditLogger');

const router = express.Router();

async function getQueueItem(pool, item) {
  let content = null;
  if (item.content_type === 'creator_content') {
    const { rows } = await pool.query(
      `SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       WHERE c.id = $1`,
      [item.content_id]
    );
    if (rows.length > 0) content = { ...rows[0], type: 'creator_content' };
  } else if (item.content_type === 'business_content') {
    const { rows } = await pool.query(
      `SELECT bc.*, b.company_name, b.slug AS business_slug
       FROM business_content bc
       JOIN businesses b ON b.id = bc.business_id
       WHERE bc.id = $1`,
      [item.content_id]
    );
    if (rows.length > 0) content = { ...rows[0], type: 'business_content' };
  }
  return { ...item, content };
}

router.get('/', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = parseInt(offset, 10) || 0;
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending'`);
    const total = parseInt(countRes.rows[0].count, 10);
    const { rows } = await pool.query(
      `SELECT * FROM moderation_queue WHERE status = 'pending' ORDER BY submitted_at ASC LIMIT $1 OFFSET $2`,
      [safeLimit, safeOffset]
    );
    const enriched = await Promise.all(rows.map((r) => getQueueItem(pool, r)));
    return res.json({ data: enriched, total, limit: safeLimit, offset: safeOffset });
  } catch (err) {
    throw err;
  }
});

router.post('/:id/approve', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM moderation_queue WHERE id = $1`, [id]);
    if (rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Queue item not found' }); }
    const item = rows[0];
    if (item.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Item is not pending' }); }
    const table = item.content_type === 'creator_content' ? 'content' : 'business_content';
    await client.query(`UPDATE ${table} SET status = 'published', updated_at = NOW() WHERE id = $1`, [item.content_id]);
    await client.query(`UPDATE moderation_queue SET status = 'approved', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2`, [req.user.id, id]);
    await client.query('COMMIT');
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'QUEUE_ITEM_APPROVED', target_type: 'moderation_queue', target_id: parseInt(id, 10), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.post('/:id/reject', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  const { reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM moderation_queue WHERE id = $1`, [id]);
    if (rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Queue item not found' }); }
    const item = rows[0];
    if (item.status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Item is not pending' }); }
    const table = item.content_type === 'creator_content' ? 'content' : 'business_content';
    await client.query(`UPDATE ${table} SET status = 'rejected', updated_at = NOW() WHERE id = $1`, [item.content_id]);
    await client.query(`UPDATE moderation_queue SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3`, [reason || null, req.user.id, id]);
    await client.query('COMMIT');
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'QUEUE_ITEM_REJECTED', target_type: 'moderation_queue', target_id: parseInt(id, 10), ip_address: req.ip, meta: { reason } });
    return res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.post('/bulk', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'ids array and action (approve/reject) required' });
  }
  const { reason } = req.body;
  const results = { success: [], failed: [] };
  for (const id of ids) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`SELECT * FROM moderation_queue WHERE id = $1`, [id]);
      if (rows.length === 0 || rows[0].status !== 'pending') { await client.query('ROLLBACK'); results.failed.push(id); continue; }
      const item = rows[0];
      const table = item.content_type === 'creator_content' ? 'content' : 'business_content';
      const newStatus = action === 'approve' ? 'published' : 'rejected';
      await client.query(`UPDATE ${table} SET status = $1, updated_at = NOW() WHERE id = $2`, [newStatus, item.content_id]);
      await client.query(`UPDATE moderation_queue SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $4`, [action === 'approve' ? 'approved' : 'rejected', reason || null, req.user.id, id]);
      await client.query('COMMIT');
      results.success.push(id);
      auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: action === 'approve' ? 'QUEUE_ITEM_APPROVED' : 'QUEUE_ITEM_REJECTED', target_type: 'moderation_queue', target_id: id, ip_address: req.ip });
    } catch (err) {
      await client.query('ROLLBACK');
      results.failed.push(id);
    } finally {
      client.release();
    }
  }
  return res.json({ results });
});

module.exports = router;
