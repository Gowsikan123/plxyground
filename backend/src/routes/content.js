'use strict';
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const auditLogger = require('../utils/auditLogger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, sport, limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    const params = [];
    const conditions = ["c.status = 'published'"];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(c.title ILIKE $${params.length} OR c.body ILIKE $${params.length})`);
    }
    if (sport) {
      params.push(sport);
      conditions.push(`cr.sport = $${params.length}`);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(lim, off);
    const dataQuery = `
      SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.avatar_url, cr.sport AS creator_sport
      FROM content c JOIN creators cr ON cr.id = c.creator_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(*) FROM content c JOIN creators cr ON cr.id = c.creator_id ${where}
    `;
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, params),
      pool.query(countQuery, countParams),
    ]);
    return res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), limit: lim, offset: off });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.avatar_url, cr.sport AS creator_sport
       FROM content c JOIN creators cr ON cr.id = c.creator_id
       WHERE c.id = $1 AND c.status = 'published'`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });
    pool.query('UPDATE content SET view_count = view_count + 1 WHERE id = $1', [req.params.id]).catch(() => {});
    return res.json({ post: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title is required.'),
    body('media_type').optional().isIn(['image', 'video', 'none']).withMessage('Invalid media type.'),
  ],
  validate,
  async (req, res) => {
    try {
      if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
      const { title, body: bodyText, media_url, media_type = 'none', tags = [] } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO content (creator_id, title, body, media_url, media_type, tags)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *`,
        [req.user.creator_id, title, bodyText || null, media_url || null, media_type, JSON.stringify(tags)]
      );
      const post = rows[0];
      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`,
        [post.id]
      );
      await auditLogger.log({ actor_type: 'creator', actor_id: req.user.id, action: 'CONTENT_CREATED', target_type: 'content', target_id: post.id, ip_address: req.ip });
      return res.status(201).json({ post });
    } catch (err) {
      return res.status(500).json({ error: 'Server error.' });
    }
  }
);

router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
    const { rows: existing } = await pool.query(
      'SELECT * FROM content WHERE id = $1 AND creator_id = $2',
      [req.params.id, req.user.creator_id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Post not found or not yours.' });
    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const requeue = (title && title !== existing[0].title) || (bodyText && bodyText !== existing[0].body);
    const newStatus = requeue && existing[0].status === 'published' ? 'pending' : existing[0].status;
    const { rows } = await pool.query(
      `UPDATE content SET title = COALESCE($1, title), body = COALESCE($2, body),
       media_url = COALESCE($3, media_url), media_type = COALESCE($4, media_type),
       tags = COALESCE($5::jsonb, tags), status = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [title || null, bodyText || null, media_url || null, media_type || null,
       tags ? JSON.stringify(tags) : null, newStatus, req.params.id]
    );
    if (requeue) {
      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`,
        [req.params.id]
      );
    }
    return res.json({ post: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
    const { rows } = await pool.query(
      'SELECT id FROM content WHERE id = $1 AND creator_id = $2',
      [req.params.id, req.user.creator_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found or not yours.' });
    await pool.query("UPDATE content SET status = 'deleted' WHERE id = $1", [req.params.id]);
    await auditLogger.log({ actor_type: 'creator', actor_id: req.user.id, action: 'CONTENT_DELETED', target_type: 'content', target_id: parseInt(req.params.id, 10), ip_address: req.ip });
    return res.json({ message: 'Post deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
