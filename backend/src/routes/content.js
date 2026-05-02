'use strict';
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const auditLogger = require('../utils/auditLogger');
const logger = require('../logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, sport, tags, limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    const conditions = [`c2.status = 'published'`];
    const params = [];
    let idx = 1;
    if (search) { conditions.push(`(c2.title ILIKE $${idx} OR c2.body ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (sport) { conditions.push(`cr.sport ILIKE $${idx}`); params.push(sport); idx++; }
    if (tags) { conditions.push(`c2.tags @> $${idx}::jsonb`); params.push(JSON.stringify([tags])); idx++; }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM content c2 JOIN creators cr ON cr.id = c2.creator_id ${where}`,
      params
    );
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT c2.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.avatar_url, cr.sport AS creator_sport
       FROM content c2 JOIN creators cr ON cr.id = c2.creator_id ${where}
       ORDER BY c2.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    return res.json({ data: rows, total: countRes.rows[0].total, limit: lim, offset: off });
  } catch (err) {
    logger.error('GET /api/content', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c2.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.avatar_url, cr.sport AS creator_sport
       FROM content c2 JOIN creators cr ON cr.id = c2.creator_id
       WHERE c2.id = $1 AND c2.status = 'published'`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });
    pool.query('UPDATE content SET view_count = view_count + 1 WHERE id = $1', [req.params.id]).catch(() => {});
    return res.json({ post: rows[0] });
  } catch (err) {
    logger.error('GET /api/content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

router.post('/', requireAuth, [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('media_type').optional().isIn(['image', 'video', 'none']).withMessage('Invalid media type.'),
], handleValidation, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
  try {
    const { title, body: bodyText, media_url, media_type = 'none', tags = [] } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO content (creator_id, title, body, media_url, media_type, tags) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.creator_id, title, bodyText || null, media_url || null, media_type, JSON.stringify(tags)]
    );
    const post = rows[0];
    await pool.query('INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)', ['creator_content', post.id]);
    await auditLogger.log({ actor_type: 'creator', actor_id: req.user.creator_id, action: 'CONTENT_CREATED', target_type: 'content', target_id: post.id, ip_address: req.ip });
    return res.status(201).json({ post });
  } catch (err) {
    logger.error('POST /api/content', { message: err.message });
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
  try {
    const { rows } = await pool.query('SELECT * FROM content WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });
    if (rows[0].creator_id !== req.user.creator_id) return res.status(403).json({ error: 'Not your post.' });
    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const changed = (title && title !== rows[0].title) || (bodyText && bodyText !== rows[0].body);
    const newStatus = (changed && rows[0].status === 'published') ? 'pending' : rows[0].status;
    const updated = await pool.query(
      'UPDATE content SET title=COALESCE($1,title), body=COALESCE($2,body), media_url=COALESCE($3,media_url), media_type=COALESCE($4,media_type), tags=COALESCE($5::jsonb,tags), status=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [title || null, bodyText || null, media_url || null, media_type || null, tags ? JSON.stringify(tags) : null, newStatus, req.params.id]
    );
    if (changed && rows[0].status === 'published') {
      await pool.query('INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)', ['creator_content', rows[0].id]);
    }
    return res.json({ post: updated.rows[0] });
  } catch (err) {
    logger.error('PUT /api/content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update post.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
  try {
    const { rows } = await pool.query('SELECT * FROM content WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Post not found.' });
    if (rows[0].creator_id !== req.user.creator_id) return res.status(403).json({ error: 'Not your post.' });
    await pool.query("UPDATE content SET status = 'deleted' WHERE id = $1", [req.params.id]);
    await auditLogger.log({ actor_type: 'creator', actor_id: req.user.creator_id, action: 'CONTENT_DELETED', target_type: 'content', target_id: rows[0].id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

module.exports = router;
