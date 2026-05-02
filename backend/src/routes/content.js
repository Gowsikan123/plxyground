'use strict';
const express = require('express');
const { body, query: qv, param } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { auditLog } = require('../utils/auditLogger');
const logger = require('../logger');

// GET /api/content  — public approved feed
router.get(
  '/',
  [qv('sport').optional().trim(), qv('page').optional().isInt({ min: 1 }), qv('limit').optional().isInt({ min: 1, max: 50 })],
  validate,
  async (req, res) => {
    try {
      const page  = parseInt(req.query.page  || '1',  10);
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;
      const sport = req.query.sport || null;

      const params = ['approved'];
      let where = 'WHERE c.status = $1';
      if (sport) { where += ' AND c.sport = $2'; params.push(sport); }

      const sql = `
        SELECT c.id, c.title, c.body, c.media_url, c.media_type, c.sport, c.tags,
               c.likes_count, c.comments_count, c.created_at,
               u.id AS user_id, u.display_name, u.avatar_url, u.slug AS user_slug
        FROM content c
        JOIN users u ON u.id = c.user_id
        ${where}
        ORDER BY c.created_at DESC
        LIMIT ${limit} OFFSET ${offset}`;

      const result = await db.query(sql, params);
      return res.json({ content: result.rows, page, limit });
    } catch (err) {
      logger.error('content.list error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/content/:id
router.get('/:id', [param('id').isInt()], validate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.display_name, u.avatar_url, u.slug AS user_slug
       FROM content c JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 AND c.status = 'approved'`,
      [req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Content not found' });
    return res.json({ content: result.rows[0] });
  } catch (err) {
    logger.error('content.get error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/content  — creator creates post
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().isLength({ min: 1, max: 300 }).withMessage('Title required'),
    body('media_type').optional().isIn(['image', 'video', 'reel', 'short']),
    body('sport').optional().trim().isLength({ max: 50 }),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, body: postBody, media_url, media_type, sport, tags } = req.body;
      const result = await db.query(
        `INSERT INTO content (user_id, title, body, media_url, media_type, sport, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user.id, title, postBody || null, media_url || null, media_type || null, sport || null, tags || []],
      );
      auditLog({ actorId: req.user.id, actorType: 'user', action: 'content.create', targetType: 'content', targetId: result.rows[0].id, ip: req.ip });
      return res.status(201).json({ content: result.rows[0] });
    } catch (err) {
      logger.error('content.create error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/content/:id
router.patch(
  '/:id',
  requireAuth,
  [param('id').isInt(), body('title').optional().trim().isLength({ min: 1, max: 300 })],
  validate,
  async (req, res) => {
    try {
      const result = await db.query('SELECT id, user_id FROM content WHERE id = $1', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Content not found' });
      if (result.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

      const { title, body: postBody, media_url, sport, tags } = req.body;
      const updated = await db.query(
        `UPDATE content SET title = COALESCE($1, title), body = COALESCE($2, body),
         media_url = COALESCE($3, media_url), sport = COALESCE($4, sport),
         tags = COALESCE($5, tags), updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [title, postBody, media_url, sport, tags, req.params.id],
      );
      return res.json({ content: updated.rows[0] });
    } catch (err) {
      logger.error('content.update error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// DELETE /api/content/:id
router.delete('/:id', requireAuth, [param('id').isInt()], validate, async (req, res) => {
  try {
    const result = await db.query('SELECT id, user_id FROM content WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Content not found' });
    if (result.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await db.query('DELETE FROM content WHERE id = $1', [req.params.id]);
    auditLog({ actorId: req.user.id, actorType: 'user', action: 'content.delete', targetType: 'content', targetId: parseInt(req.params.id, 10), ip: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('content.delete error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
