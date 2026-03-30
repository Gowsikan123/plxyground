const express = require('express');
const db = require('../db/setup');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const CONTENT_TYPES = ['article', 'video_embed', 'image_story'];

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// GET /api/content - public feed
router.get('/', (req, res) => {
  const { search, limit = 20, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 100);
  const off = parseInt(offset) || 0;

  let query = `
    SELECT c.*, cr.name as creator_name, cr.profile_slug
    FROM content c
    JOIN creators cr ON cr.id = c.creator_id
    WHERE c.is_published = 1
  `;
  const params = [];

  if (search) {
    query += ` AND (c.title LIKE ? OR c.body LIKE ? OR cr.name LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ` ORDER BY c.feed_rank_at DESC, c.published_at DESC LIMIT ? OFFSET ?`;
  params.push(lim, off);

  const rows = db.prepare(query).all(...params);
  res.json({ data: rows, limit: lim, offset: off });
});

// GET /api/content/recommend - recommended content
router.get('/recommend', (req, res) => {
  const userId = req.user ? req.user.id : null;
  const recent = db.prepare(`SELECT c.*, cr.name as creator_name, cr.profile_slug FROM content c JOIN creators cr ON c.creator_id = cr.id WHERE c.is_published = 1 ORDER BY c.created_at DESC LIMIT 10`).all();
  const trending = db.prepare(`SELECT c.*, cr.name as creator_name, cr.profile_slug FROM content c JOIN creators cr ON c.creator_id = cr.id WHERE c.is_published = 1 ORDER BY c.order_priority DESC, c.updated_at DESC LIMIT 10`).all();

  if (userId) {
    const personal = db.prepare(`SELECT c.*, cr.name as creator_name, cr.profile_slug FROM content c JOIN creators cr ON c.creator_id = cr.id WHERE c.is_published = 1 ORDER BY c.feed_rank_at DESC, c.created_at DESC LIMIT 10`).all();
    return res.json({ mode: 'personal', data: personal, fallback: { trending, recent } });
  }

  res.json({ mode: 'aggregate', data: [...new Map([...trending, ...recent].map((item)=>[item.id,item])).values()] });
});

// GET /api/content/:id - single post
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT c.*, cr.name as creator_name, cr.profile_slug
    FROM content c
    JOIN creators cr ON cr.id = c.creator_id
    WHERE c.id = ? AND c.is_published = 1
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/content - create post (auth required)
router.post('/', verifyToken, (req, res) => {
  const { title, body, content_type, media_url, order_priority } = req.body;

  if (!title || !body || !content_type || !media_url) {
    return res.status(400).json({ error: 'title, body, content_type, and media_url are required' });
  }

  if (title.trim().length > 500) return res.status(400).json({ error: 'title must be 500 characters or less' });
  if (body.trim().length > 50000) return res.status(400).json({ error: 'body must be 50000 characters or less' });
  if (!CONTENT_TYPES.includes(content_type)) return res.status(400).json({ error: 'content_type must be article, video_embed, or image_story' });

  if (!isValidUrl(media_url)) return res.status(400).json({ error: 'media_url must be a valid URL' });

  try {
    const result = db.prepare(`
      INSERT INTO content (creator_id, content_type, title, body, media_url, order_priority, is_published)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(req.user.id, content_type, title, body, media_url, order_priority || 0);

    db.prepare(`
      INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
      VALUES ('content', 'pending', ?, ?, ?)
    `).run(title, req.user.email, result.lastInsertRowid);

    const post = db.prepare('SELECT * FROM content WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/content/:id - edit post (owner only)
router.put('/:id', verifyToken, (req, res) => {
  const { title, body, content_type, media_url, order_priority } = req.body;

  if (!media_url) {
    return res.status(400).json({ error: 'media_url is required' });
  }

  if (title && title.trim().length > 500) return res.status(400).json({ error: 'title must be 500 characters or less' });
  if (body && body.trim().length > 50000) return res.status(400).json({ error: 'body must be 50000 characters or less' });
  if (content_type && !CONTENT_TYPES.includes(content_type)) return res.status(400).json({ error: 'Invalid content_type' });
  if (!isValidUrl(media_url)) return res.status(400).json({ error: 'media_url must be a valid URL' });

  const post = db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.creator_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });

  const allowed = ['article', 'video_embed', 'image_story'];
  if (content_type && !allowed.includes(content_type)) {
    return res.status(400).json({ error: 'Invalid content_type' });
  }

  db.prepare(`
    UPDATE content SET
      title = ?, body = ?, content_type = ?, media_url = ?,
      order_priority = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || post.title,
    body || post.body,
    content_type || post.content_type,
    media_url,
    order_priority ?? post.order_priority,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/content/:id - delete post (owner only)
router.delete('/:id', verifyToken, (req, res) => {
  const post = db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (post.creator_id !== req.user.id) return res.status(403).json({ error: 'Not your post' });

  db.prepare('DELETE FROM content WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;