'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getPool } = require('../db/client');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const auditLogger = require('../utils/auditLogger');

const router = express.Router();

router.get('/', async (req, res) => {
  const pool = getPool();
  const { search, sport, tags, limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = parseInt(offset, 10) || 0;

  try {
    const conditions = ["c.status = 'published'"];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(c.title ILIKE $${idx} OR c.body ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (sport) {
      conditions.push(`cr.sport ILIKE $${idx}`);
      params.push(`%${sport}%`);
      idx++;
    }
    if (tags) {
      conditions.push(`c.tags @> $${idx}::jsonb`);
      params.push(JSON.stringify([tags]));
      idx++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM content c JOIN creators cr ON cr.id = c.creator_id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(safeLimit);
    params.push(safeOffset);

    const { rows } = await pool.query(
      `SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.avatar_url, cr.sport AS creator_sport
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return res.json({ data: rows, total, limit: safeLimit, offset: safeOffset });
  } catch (err) {
    throw err;
  }
});

router.get('/:id', async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.avatar_url, cr.sport AS creator_sport
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       WHERE c.id = $1 AND c.status = 'published'`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    pool.query(`UPDATE content SET view_count = view_count + 1 WHERE id = $1`, [id]).catch(() => {});
    return res.json({ data: rows[0] });
  } catch (err) {
    throw err;
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('media_type').optional().isIn(['image', 'video', 'none']).withMessage('Invalid media type'),
  ],
  validate,
  async (req, res) => {
    if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator auth required' });
    const pool = getPool();
    const { title, body: bodyText, media_url, media_type = 'none', tags = [] } = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO content (creator_id, title, body, media_url, media_type, tags) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.user.creator_id, title, bodyText || null, media_url || null, media_type, JSON.stringify(tags)]
      );
      const content = rows[0];
      await pool.query(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`, [content.id]);
      auditLogger.log({ actor_type: 'creator', actor_id: req.user.id, action: 'CONTENT_CREATED', target_type: 'content', target_id: content.id, ip_address: req.ip });
      return res.status(201).json({ content });
    } catch (err) {
      throw err;
    }
  }
);

router.put('/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator auth required' });
  const pool = getPool();
  const { id } = req.params;
  try {
    const { rows: existing } = await pool.query(`SELECT * FROM content WHERE id = $1`, [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Content not found' });
    if (existing[0].creator_id !== req.user.creator_id) return res.status(403).json({ error: 'Not authorised' });
    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const wasPublished = existing[0].status === 'published';
    const contentChanged = (title && title !== existing[0].title) || (bodyText && bodyText !== existing[0].body);
    const newStatus = wasPublished && contentChanged ? 'pending' : existing[0].status;
    const { rows } = await pool.query(
      `UPDATE content SET title = COALESCE($1, title), body = COALESCE($2, body), media_url = COALESCE($3, media_url), media_type = COALESCE($4, media_type), tags = COALESCE($5, tags), status = $6, updated_at = NOW() WHERE id = $7 RETURNING *`,
      [title || null, bodyText || null, media_url || null, media_type || null, tags ? JSON.stringify(tags) : null, newStatus, id]
    );
    if (wasPublished && contentChanged) {
      await pool.query(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`, [id]);
    }
    return res.json({ content: rows[0] });
  } catch (err) {
    throw err;
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator auth required' });
  const pool = getPool();
  const { id } = req.params;
  try {
    const { rows: existing } = await pool.query(`SELECT * FROM content WHERE id = $1`, [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Content not found' });
    if (existing[0].creator_id !== req.user.creator_id) return res.status(403).json({ error: 'Not authorised' });
    await pool.query(`UPDATE content SET status = 'deleted' WHERE id = $1`, [id]);
    auditLogger.log({ actor_type: 'creator', actor_id: req.user.id, action: 'CONTENT_DELETED', target_type: 'content', target_id: parseInt(id, 10), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
