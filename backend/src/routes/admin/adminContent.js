const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/content - list all content
router.get('/', async (req, res) => {
  const { search, limit = 2000, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 2000);
  const off = parseInt(offset) || 0;

  let query = `
    SELECT c.*, cr.name as creator_name, cr.profile_slug
    FROM content c
    JOIN creators cr ON cr.id = c.creator_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (c.title LIKE ? OR c.body LIKE ? OR cr.name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
  params.push(lim, off);

  const rows = await db.prepare(query).all(...params);
  res.json({ data: rows, limit: lim, offset: off });
});

// PUT /api/admin/content/:id - approve/publish/unpublish
router.put('/:id', async (req, res) => {
  const {
    is_published,
    title,
    body,
    content_type,
    media_url,
    campaign_goal,
    call_to_action,
    target_creator_profile
  } = req.body;

  const post = await db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });

  const before = JSON.stringify(post);

  await db.prepare(`
    UPDATE content SET
      is_published = ?,
      title = ?,
      body = ?,
      content_type = ?,
      media_url = ?,
      campaign_goal = ?,
      call_to_action = ?,
      target_creator_profile = ?,
      published_at = CASE WHEN ? = 1 AND is_published = 0 THEN datetime('now') ELSE published_at END,
      feed_rank_at = CASE WHEN ? = 1 AND is_published = 0 THEN datetime('now') ELSE feed_rank_at END,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    is_published !== undefined ? is_published : post.is_published,
    title || post.title,
    body || post.body,
    content_type || post.content_type,
    media_url || post.media_url,
    campaign_goal !== undefined ? campaign_goal : post.campaign_goal,
    call_to_action !== undefined ? call_to_action : post.call_to_action,
    target_creator_profile !== undefined ? target_creator_profile : post.target_creator_profile,
    is_published !== undefined ? is_published : post.is_published,
    is_published !== undefined ? is_published : post.is_published,
    req.params.id
  );

  const after = await db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);

  await db.prepare(`
    INSERT INTO audit_log (action_type, actor, target, before_snapshot, after_snapshot)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    is_published ? 'PUBLISH_CONTENT' : 'UNPUBLISH_CONTENT',
    req.user.email,
    `content:${req.params.id}`,
    before,
    JSON.stringify(after)
  );

  if (is_published) {
    await db.prepare(`
      UPDATE moderation_queue SET status = 'approved', updated_at = datetime('now')
      WHERE entity_id = ? AND type = 'content'
    `).run(req.params.id);
  }

  res.json(after);
});

// DELETE /api/admin/content/:id
router.delete('/:id', async (req, res) => {
  const post = await db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });

  await db.prepare(`
    INSERT INTO audit_log (action_type, actor, target, before_snapshot)
    VALUES ('DELETE_CONTENT', ?, ?, ?)
  `).run(req.user.email, `content:${req.params.id}`, JSON.stringify(post));

  await db.prepare('DELETE FROM content WHERE id = ?').run(req.params.id);
  await db.prepare(`DELETE FROM moderation_queue WHERE entity_id = ? AND type = 'content'`).run(req.params.id);

  res.json({ message: 'Deleted' });
});

module.exports = router;
