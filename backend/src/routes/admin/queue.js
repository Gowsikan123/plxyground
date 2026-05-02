'use strict';
const express = require('express');
const pool = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = express.Router();

router.use(requireAdmin);

// GET /api/admin/queue?status=pending
router.get('/', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const result = await pool.query(
      `SELECT
         mq.id,
         mq.content_type,
         mq.content_id,
         mq.status,
         mq.review_note,
         mq.submitted_at   AS created_at,
         mq.reviewed_at,
         CASE
           WHEN mq.content_type = 'creator_content'
             THEN (SELECT co.title FROM content co WHERE co.id = mq.content_id)
           WHEN mq.content_type = 'business_content'
             THEN (SELECT bc.title FROM business_content bc WHERE bc.id = mq.content_id)
           WHEN mq.content_type = 'opportunity'
             THEN (SELECT op.title FROM opportunities op WHERE op.id = mq.content_id)
           ELSE NULL
         END AS title_or_name,
         CASE
           WHEN mq.content_type = 'creator_content'
             THEN (SELECT c.username FROM content co JOIN creators c ON co.creator_id = c.id WHERE co.id = mq.content_id)
           WHEN mq.content_type = 'business_content'
             THEN (SELECT b.company_name FROM business_content bc JOIN businesses b ON bc.business_id = b.id WHERE bc.id = mq.content_id)
           WHEN mq.content_type = 'opportunity'
             THEN (SELECT b.company_name FROM opportunities op JOIN businesses b ON op.business_id = b.id WHERE op.id = mq.content_id)
           ELSE NULL
         END AS submitted_by
       FROM moderation_queue mq
       WHERE mq.status = $1
       ORDER BY mq.submitted_at ASC`,
      [status]
    );
    return res.json({ data: result.rows });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// POST /api/admin/queue/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await pool.query('SELECT * FROM moderation_queue WHERE id=$1 LIMIT 1', [id]);
    if (!item.rows.length) return res.status(404).json({ error: 'Queue item not found' });
    const q = item.rows[0];

    await pool.query(
      'UPDATE moderation_queue SET status=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3',
      ['approved', req.admin.id, id]
    );

    if (q.content_type === 'creator_content') {
      await pool.query(`UPDATE content SET is_published=TRUE, updated_at=NOW() WHERE id=$1`, [q.content_id]);
    } else if (q.content_type === 'business_content') {
      await pool.query(`UPDATE business_content SET is_published=TRUE, updated_at=NOW() WHERE id=$1`, [q.content_id]);
    } else if (q.content_type === 'opportunity') {
      await pool.query(`UPDATE opportunities SET is_published=TRUE, updated_at=NOW() WHERE id=$1`, [q.content_id]);
    }

    await audit.log({
      actor_type: 'admin', actor_id: req.admin.id,
      action: 'APPROVE_CONTENT',
      target_type: q.content_type, target_id: q.content_id,
      ip_address: req.ip,
    });

    return res.json({ message: 'Content approved' });
  } catch {
    return res.status(500).json({ error: 'Approval failed' });
  }
});

// POST /api/admin/queue/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await pool.query('SELECT * FROM moderation_queue WHERE id=$1 LIMIT 1', [id]);
    if (!item.rows.length) return res.status(404).json({ error: 'Queue item not found' });
    const q = item.rows[0];
    const note = req.body.note || null;

    await pool.query(
      'UPDATE moderation_queue SET status=$1, reviewed_by=$2, reviewed_at=NOW(), review_note=$3 WHERE id=$4',
      ['rejected', req.admin.id, note, id]
    );

    if (q.content_type === 'creator_content') {
      await pool.query(`UPDATE content SET is_published=FALSE, updated_at=NOW() WHERE id=$1`, [q.content_id]);
    } else if (q.content_type === 'business_content') {
      await pool.query(`UPDATE business_content SET is_published=FALSE, updated_at=NOW() WHERE id=$1`, [q.content_id]);
    } else if (q.content_type === 'opportunity') {
      await pool.query(`UPDATE opportunities SET is_published=FALSE, updated_at=NOW() WHERE id=$1`, [q.content_id]);
    }

    await audit.log({
      actor_type: 'admin', actor_id: req.admin.id,
      action: 'REJECT_CONTENT',
      target_type: q.content_type, target_id: q.content_id,
      metadata: { note }, ip_address: req.ip,
    });

    return res.json({ message: 'Content rejected' });
  } catch {
    return res.status(500).json({ error: 'Rejection failed' });
  }
});

// POST /api/admin/queue/bulk-action  { action: 'approve'|'reject'|'delete', ids: number[] }
router.post('/bulk-action', async (req, res) => {
  try {
    const { action, ids } = req.body;
    if (!['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve, reject, or delete' });
    }
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }

    const sanitised = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
    if (!sanitised.length) return res.status(400).json({ error: 'No valid ids provided' });

    const items = await pool.query(
      `SELECT * FROM moderation_queue WHERE id = ANY($1::int[])`,
      [sanitised]
    );

    for (const q of items.rows) {
      if (action === 'approve') {
        await pool.query(
          'UPDATE moderation_queue SET status=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3',
          ['approved', req.admin.id, q.id]
        );
        if (q.content_type === 'creator_content') {
          await pool.query('UPDATE content SET is_published=TRUE, updated_at=NOW() WHERE id=$1', [q.content_id]);
        } else if (q.content_type === 'business_content') {
          await pool.query('UPDATE business_content SET is_published=TRUE, updated_at=NOW() WHERE id=$1', [q.content_id]);
        } else if (q.content_type === 'opportunity') {
          await pool.query('UPDATE opportunities SET is_published=TRUE, updated_at=NOW() WHERE id=$1', [q.content_id]);
        }
        await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'BULK_APPROVE', target_type: q.content_type, target_id: q.content_id, ip_address: req.ip });
      } else if (action === 'reject') {
        await pool.query(
          'UPDATE moderation_queue SET status=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3',
          ['rejected', req.admin.id, q.id]
        );
        if (q.content_type === 'creator_content') {
          await pool.query('UPDATE content SET is_published=FALSE, updated_at=NOW() WHERE id=$1', [q.content_id]);
        } else if (q.content_type === 'business_content') {
          await pool.query('UPDATE business_content SET is_published=FALSE, updated_at=NOW() WHERE id=$1', [q.content_id]);
        } else if (q.content_type === 'opportunity') {
          await pool.query('UPDATE opportunities SET is_published=FALSE, updated_at=NOW() WHERE id=$1', [q.content_id]);
        }
        await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'BULK_REJECT', target_type: q.content_type, target_id: q.content_id, ip_address: req.ip });
      } else if (action === 'delete') {
        await pool.query('DELETE FROM moderation_queue WHERE id=$1', [q.id]);
        await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'BULK_DELETE', target_type: q.content_type, target_id: q.content_id, ip_address: req.ip });
      }
    }

    return res.json({ message: `Bulk ${action} completed`, affected: items.rows.length });
  } catch {
    return res.status(500).json({ error: 'Bulk action failed' });
  }
});

module.exports = router;
