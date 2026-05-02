'use strict';
const express = require('express');
const pool = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const result = await pool.query(
      `SELECT mq.*, 
         CASE 
           WHEN mq.content_type='creator_content' THEN (SELECT row_to_json(t) FROM (SELECT co.*, c.username, c.display_name FROM content co JOIN creators c ON co.creator_id=c.id WHERE co.id=mq.content_id) t)
           WHEN mq.content_type='business_content' THEN (SELECT row_to_json(t) FROM (SELECT bc.*, b.company_name FROM business_content bc JOIN businesses b ON bc.business_id=b.id WHERE bc.id=mq.content_id) t)
         END AS content_data
       FROM moderation_queue mq
       WHERE mq.status=$1
       ORDER BY mq.submitted_at ASC`,
      [status]
    );
    return res.json(result.rows);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await pool.query('SELECT * FROM moderation_queue WHERE id=$1', [id]);
    if (!item.rows.length) return res.status(404).json({ error: 'Queue item not found' });
    const q = item.rows[0];
    await pool.query(
      'UPDATE moderation_queue SET status=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3',
      ['approved', req.admin.id, id]
    );
    const table = q.content_type === 'creator_content' ? 'content' : 'business_content';
    await pool.query(`UPDATE ${table} SET status='published', updated_at=NOW() WHERE id=$1`, [q.content_id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'APPROVE_CONTENT', target_type: q.content_type, target_id: q.content_id, ip_address: req.ip });
    return res.json({ message: 'Content approved' });
  } catch {
    return res.status(500).json({ error: 'Approval failed' });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await pool.query('SELECT * FROM moderation_queue WHERE id=$1', [id]);
    if (!item.rows.length) return res.status(404).json({ error: 'Queue item not found' });
    const q = item.rows[0];
    const note = req.body.note || null;
    await pool.query(
      'UPDATE moderation_queue SET status=$1, reviewed_by=$2, reviewed_at=NOW(), review_note=$3 WHERE id=$4',
      ['rejected', req.admin.id, note, id]
    );
    const table = q.content_type === 'creator_content' ? 'content' : 'business_content';
    await pool.query(`UPDATE ${table} SET status='rejected', updated_at=NOW() WHERE id=$1`, [q.content_id]);
    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'REJECT_CONTENT', target_type: q.content_type, target_id: q.content_id, metadata: { note }, ip_address: req.ip });
    return res.json({ message: 'Content rejected' });
  } catch {
    return res.status(500).json({ error: 'Rejection failed' });
  }
});

module.exports = router;
