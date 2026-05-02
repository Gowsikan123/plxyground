'use strict';

const express = require('express');
const { body, query, param } = require('express-validator');
const { getPool } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { writeAudit } = require('../utils/auditLogger');
const logger = require('../logger');

const router = express.Router();

// GET /api/content — public feed
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sport').optional().trim(),
    query('search').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const { sport, search } = req.query;

      const conditions = [`c.status = 'approved'`];
      const params = [];

      if (sport) {
        params.push(sport);
        conditions.push(`c.sport = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`(c.title ILIKE $${params.length} OR c.body ILIKE $${params.length})`);
      }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
      params.push(limit, offset);

      const sql = `
        SELECT c.id, c.title, c.body, c.media_url, c.media_type, c.tags, c.sport,
               c.view_count, c.like_count, c.created_at,
               cr.id as creator_id, cr.username, cr.display_name, cr.avatar_url, cr.sport as creator_sport, cr.slug as creator_slug
        FROM content c
        JOIN creators cr ON cr.id = c.creator_id
        ${where}
        ORDER BY c.created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;

      const { rows } = await getPool().query(sql, params);

      const posts = rows.map((r) => ({
        id: r.id, title: r.title, body: r.body,
        media_url: r.media_url, media_type: r.media_type,
        tags: r.tags, sport: r.sport,
        view_count: r.view_count, like_count: r.like_count,
        created_at: r.created_at,
        creator: { id: r.creator_id, username: r.username, display_name: r.display_name, avatar_url: r.avatar_url, sport: r.creator_sport, slug: r.creator_slug },
      }));

      return res.json({ posts, page, limit });
    } catch (err) {
      logger.error('content feed error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/content/:id
router.get('/:id', [param('id').isInt().toInt()], validate, async (req, res) => {
  try {
    const { rows } = await getPool().query(
      `SELECT c.*, cr.username, cr.display_name, cr.avatar_url, cr.sport as creator_sport, cr.slug as creator_slug
       FROM content c JOIN creators cr ON cr.id = c.creator_id
       WHERE c.id = $1 AND c.status = 'approved'`,
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });

    await getPool().query('UPDATE content SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);

    const r = rows[0];
    return res.json({
      post: {
        ...r,
        creator: { id: r.creator_id, username: r.username, display_name: r.display_name, avatar_url: r.avatar_url, sport: r.creator_sport, slug: r.creator_slug },
      },
    });
  } catch (err) {
    logger.error('get content error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/content — create post (creator only)
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().isLength({ min: 3, max: 200 }),
    body('body').optional().trim().isLength({ max: 5000 }),
    body('sport').optional().trim().isLength({ max: 50 }),
    body('media_url').optional().isURL(),
    body('media_type').optional().isIn(['none', 'image', 'video', 'link']),
    body('tags').optional().isArray({ max: 10 }),
  ],
  validate,
  async (req, res) => {
    if (req.user.type !== 'creator') return res.status(403).json({ error: 'Only creators can post content' });
    try {
      const { title, body: postBody, sport, media_url, media_type, tags } = req.body;
      const { rows } = await getPool().query(
        `INSERT INTO content (creator_id, title, body, sport, media_url, media_type, tags, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [req.user.id, title, postBody || null, sport || null, media_url || null, media_type || 'none', tags || []],
      );
      const post = rows[0];
      await getPool().query('INSERT INTO moderation_queue (content_id, reason) VALUES ($1, $2)', [post.id, 'New submission']);
      writeAudit({ actorId: req.user.id, actorType: 'creator', action: 'create_content', targetId: post.id, targetType: 'content', ip: req.ip });
      return res.status(201).json({ post });
    } catch (err) {
      logger.error('create content error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/content/:id
router.patch(
  '/:id',
  requireAuth,
  [param('id').isInt().toInt(), body('title').optional().trim().isLength({ min: 3, max: 200 }), body('body').optional().trim().isLength({ max: 5000 })],
  validate,
  async (req, res) => {
    try {
      const { rows: existing } = await getPool().query('SELECT creator_id FROM content WHERE id = $1', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Post not found' });
      if (existing[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

      const { title, body: postBody, sport, tags } = req.body;
      const { rows } = await getPool().query(
        `UPDATE content SET title = COALESCE($1, title), body = COALESCE($2, body),
         sport = COALESCE($3, sport), tags = COALESCE($4, tags), updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [title || null, postBody || null, sport || null, tags || null, req.params.id],
      );
      return res.json({ post: rows[0] });
    } catch (err) {
      logger.error('update content error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// DELETE /api/content/:id
router.delete('/:id', requireAuth, [param('id').isInt().toInt()], validate, async (req, res) => {
  try {
    const { rows } = await getPool().query('SELECT creator_id FROM content WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    if (rows[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await getPool().query('DELETE FROM content WHERE id = $1', [req.params.id]);
    writeAudit({ actorId: req.user.id, actorType: 'creator', action: 'delete_content', targetId: req.params.id, targetType: 'content', ip: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('delete content error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
