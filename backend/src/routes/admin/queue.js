'use strict';
const express = require('express');
const { body } = require('express-validator');
const sql = require('../../db/client');
const audit = require('../../utils/auditLogger');
const { notify } = require('../../utils/notify');
const { requireAdmin } = require('../../middleware/auth');
const { validationErrorHandler } = require('../../middleware/validate');

const router = express.Router();

// Creator posts are queued as 'content' (older rows may say 'creator_content').
const CREATOR_TYPES = ['content', 'creator_content'];
const isCreatorItem = (item) => CREATOR_TYPES.includes(item.content_type);
const contentTable = (item) => (isCreatorItem(item) ? 'content' : 'business_content');

async function applyDecision(item, { queueStatus, contentStatus, adminId, note }) {
  await sql`
    UPDATE moderation_queue
    SET status = ${queueStatus}, reviewed_by = ${adminId}, rejection_reason = ${note || null}, reviewed_at = NOW()
    WHERE id = ${item.id}`;
  // Table and column names come from fixed values above, never from user input.
  const ownerColumn = isCreatorItem(item) ? 'creator_id' : 'business_id';
  const { rows } = await sql.query(
    `UPDATE ${contentTable(item)} SET status = $1, updated_at = NOW() WHERE id = $2
     RETURNING ${ownerColumn} AS owner_id, title`,
    [contentStatus, item.content_id]
  );
  const post = rows[0];
  if (post && contentStatus !== 'deleted') {
    await notify({
      recipientType: isCreatorItem(item) ? 'creator' : 'business',
      recipientId: post.owner_id,
      type: contentStatus === 'published' ? 'post_approved' : 'post_rejected',
      title: contentStatus === 'published' ? `Your post "${post.title}" is live` : `Your post "${post.title}" wasn't approved`,
      body: contentStatus === 'rejected' ? note || null : null,
      referenceType: isCreatorItem(item) ? 'content' : 'business_content',
      referenceId: item.content_id,
    });
  }
}

// GET /api/admin/queue?status=pending&content_type=&limit=&offset=
// Admin panel reads: data[] with title_or_name, submitted_by, type, status, created_at
router.get('/', requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const contentType = req.query.content_type || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;

    const params = [status];
    let where = 'WHERE mq.status = $1';
    if (contentType) {
      params.push(contentType);
      where += ` AND mq.content_type = $${params.length}`;
    }

    const [{ rows }, { rows: countRows }] = await Promise.all([
      sql.query(
        `SELECT
           mq.id, mq.content_id, mq.content_type, mq.status,
           mq.rejection_reason AS review_note, mq.reviewed_at, mq.created_at,
           CASE WHEN mq.content_type IN ('content','creator_content') THEN c.title ELSE bc.title END AS title_or_name,
           CASE WHEN mq.content_type IN ('content','creator_content') THEN cr.display_name ELSE b.company_name END AS submitted_by,
           CASE WHEN mq.content_type IN ('content','creator_content') THEN 'creator' ELSE 'business' END AS type
         FROM moderation_queue mq
         LEFT JOIN content          c  ON mq.content_type IN ('content','creator_content') AND mq.content_id = c.id
         LEFT JOIN creators         cr ON c.creator_id = cr.id
         LEFT JOIN business_content bc ON mq.content_type = 'business_content' AND mq.content_id = bc.id
         LEFT JOIN businesses       b  ON bc.business_id = b.id
         ${where}
         ORDER BY mq.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      sql.query(`SELECT COUNT(*)::int AS n FROM moderation_queue mq ${where}`, params),
    ]);

    return res.json({ success: true, data: rows, total: countRows[0].n, limit, offset });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/queue/:id  { status, moderation_note }
router.patch(
  '/:id',
  requireAdmin,
  [body('status').isIn(['approved', 'rejected']).withMessage('status must be approved or rejected')],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { status, moderation_note = '' } = req.body;
      const [item] = await sql`SELECT * FROM moderation_queue WHERE id = ${parseInt(req.params.id, 10)}`;
      if (!item) return res.status(404).json({ success: false, error: 'Queue item not found' });

      await applyDecision(item, {
        queueStatus: status,
        contentStatus: status === 'approved' ? 'published' : 'rejected',
        adminId: req.admin.id,
        note: moderation_note,
      });
      await audit.log({
        actor_type: 'admin', actor_id: req.admin.id,
        action: status === 'approved' ? 'QUEUE_APPROVED' : 'QUEUE_REJECTED',
        target_type: item.content_type, target_id: item.content_id,
        metadata: { queue_id: item.id, note: moderation_note }, ip_address: req.ip,
      });
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/admin/queue/bulk-action  { ids: [], action: approve|reject|delete, note }
router.post(
  '/bulk-action',
  requireAdmin,
  [
    body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
    body('action').isIn(['approve', 'reject', 'delete']).withMessage('action must be approve, reject, or delete'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { ids, action, note = '' } = req.body;
      const decision = {
        approve: { queueStatus: 'approved', contentStatus: 'published' },
        reject: { queueStatus: 'rejected', contentStatus: 'rejected' },
        delete: { queueStatus: 'rejected', contentStatus: 'deleted' },
      }[action];

      let processed = 0;
      for (const rawId of ids) {
        const [item] = await sql`SELECT * FROM moderation_queue WHERE id = ${parseInt(rawId, 10)}`;
        if (!item) continue;
        await applyDecision(item, { ...decision, adminId: req.admin.id, note });
        await audit.log({
          actor_type: 'admin', actor_id: req.admin.id, action: `QUEUE_${action.toUpperCase()}`,
          target_type: item.content_type, target_id: item.content_id,
          metadata: { queue_id: item.id, note }, ip_address: req.ip,
        });
        processed += 1;
      }
      return res.json({ success: true, data: { processed } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
