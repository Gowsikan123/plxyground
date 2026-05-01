const express = require('express');
const db = require('../db/setup');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, requireRole('BUSINESS'));

// GET /api/business/content/mine - all business posts including pending items
router.get('/mine', async (req, res) => {
  const rows = await db.prepare(`
    SELECT c.*, cr.name as creator_name, cr.profile_slug
    FROM content c
    JOIN creators cr ON cr.id = c.creator_id
    WHERE c.creator_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id);

  res.json({ data: rows });
});

// POST /api/business/content - create a business campaign/content post
router.post('/', async (req, res) => {
  const {
    title,
    body,
    content_type,
    media_url,
    order_priority,
    campaign_goal,
    call_to_action,
    target_creator_profile,
  } = req.body;

  if (!title || !body || !content_type || !media_url) {
    return res.status(400).json({ error: 'title, body, content_type, and media_url are required' });
  }

  const allowed = ['article', 'video_embed', 'image_story'];
  if (!allowed.includes(content_type)) {
    return res.status(400).json({ error: 'content_type must be article, video_embed, or image_story' });
  }

  try {
    const result = await db.prepare(`
      INSERT INTO content (
        creator_id, content_type, title, body, media_url, order_priority,
        is_published, campaign_goal, call_to_action, target_creator_profile
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      req.user.id,
      content_type,
      title,
      body,
      media_url,
      order_priority || 0,
      campaign_goal || null,
      call_to_action || null,
      target_creator_profile || null
    );

    await db.prepare(`
      INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
      VALUES ('content', 'pending', ?, ?, ?)
    `).run(title, req.user.email, result.lastInsertRowid);

    const post = await db.prepare('SELECT * FROM content WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
