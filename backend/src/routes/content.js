'use strict';

const { Router } = require('express');
const { body, query } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const auditLog = require('../utils/auditLogger');

const router = Router();

// GET /api/content
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const search = req.query.search || '';
      const sport = req.query.sport || '';

      const { rows } = await pool.query(
        `SELECT c.id, c.title, c.body, c.mediaurl, c.mediatype, c.tags, c.status,
                c.viewcount, c.likecount, c.createdat, c.updatedat,
                cr.id AS creatorid, cr.username, cr.slug AS creatorslug,
                cr.displayname, cr.avatarurl, cr.sport, cr.isverified
         FROM content c
         JOIN creators cr ON cr.id = c.creatorid
         WHERE c.status = 'published'
           AND ($1 = '' OR c.title ILIKE '%' || $1 || '%' OR c.body ILIKE '%' || $1 || '%')
           AND ($2 = '' OR cr.sport ILIKE $2)
         ORDER BY c.createdat DESC
         LIMIT $3 OFFSET $4`,
        [search, sport, limit, offset]
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*) FROM content c
         JOIN creators cr ON cr.id = c.creatorid
         WHERE c.status = 'published'
           AND ($1 = '' OR c.title ILIKE '%' || $1 || '%')
           AND ($2 = '' OR cr.sport ILIKE $2)`,
        [search, sport]
      );

      return res.json({ posts: rows, total: parseInt(countRows[0].count, 10), limit, offset });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch feed', detail: err.message });
    }
  }
);

// GET /api/content/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.title, c.body, c.mediaurl, c.mediatype, c.tags, c.status,
              c.viewcount, c.likecount, c.createdat, c.updatedat,
              cr.id AS creatorid, cr.username, cr.slug AS creatorslug,
              cr.displayname, cr.avatarurl, cr.sport, cr.isverified
       FROM content c
       JOIN creators cr ON cr.id = c.creatorid
       WHERE c.id = $1 AND c.status = 'published'`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    await pool.query('UPDATE content SET viewcount = viewcount + 1 WHERE id = $1', [req.params.id]);
    return res.json({ post: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch post', detail: err.message });
  }
});

// POST /api/content
router.post(
  '/',
  requireAuth,
  [body('title').notEmpty().trim().isLength({ max: 100 })],
  validate,
  async (req, res) => {
    try {
      if (req.actor.type !== 'creator') {
        return res.status(403).json({ error: 'Creator token required' });
      }
      const { title, body: bodyText, mediaurl, mediatype, tags } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO content (creatorid, title, body, mediaurl, mediatype, tags)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.actor.id, title, bodyText || null,
          mediaurl || null, mediatype || 'none',
          JSON.stringify(Array.isArray(tags) ? tags : []),
        ]
      );
      await pool.query(
        `INSERT INTO moderation_queue (contenttype, contentid) VALUES ('creator_content', $1)`,
        [rows[0].id]
      );
      auditLog({ actorType: 'creator', actorId: req.actor.id, action: 'CONTENT_CREATE', targetType: 'content', targetId: rows[0].id });
      return res.status(201).json({ post: rows[0] });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create post', detail: err.message });
    }
  }
);

// PATCH /api/content/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    if (req.actor.type !== 'creator') {
      return res.status(403).json({ error: 'Creator token required' });
    }
    const { title, body: bodyText, mediaurl, mediatype, tags } = req.body;
    const { rows } = await pool.query(
      `UPDATE content
       SET title = COALESCE($1, title),
           body = COALESCE($2, body),
           mediaurl = COALESCE($3, mediaurl),
           mediatype = COALESCE($4, mediatype),
           tags = COALESCE($5, tags),
           updatedat = NOW()
       WHERE id = $6 AND creatorid = $7
       RETURNING *`,
      [
        title || null, bodyText || null, mediaurl || null, mediatype || null,
        tags ? JSON.stringify(tags) : null,
        req.params.id, req.actor.id,
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    return res.json({ post: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update post', detail: err.message });
  }
});

// DELETE /api/content/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.actor.type !== 'creator') {
      return res.status(403).json({ error: 'Creator token required' });
    }
    const { rows } = await pool.query(
      `UPDATE content SET status = 'deleted', updatedat = NOW()
       WHERE id = $1 AND creatorid = $2 RETURNING id`,
      [req.params.id, req.actor.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    auditLog({ actorType: 'creator', actorId: req.actor.id, action: 'CONTENT_DELETE', targetType: 'content', targetId: parseInt(req.params.id, 10) });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete post', detail: err.message });
  }
});

module.exports = router;
