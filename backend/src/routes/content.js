'use strict';

const express = require('express');
const { body, query: qv, param } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const auditLog = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const logger = require('../logger');

// GET /api/content  — public feed (approved only)
router.get(
  '/',
  [
    qv('page').optional().isInt({ min: 1 }).toInt(),
    qv('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    qv('sport').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const sport = req.query.sport || null;

      const params = [limit, offset];
      let sportClause = '';
      if (sport) {
        params.push(sport);
        sportClause = `AND c.sport = $${params.length}`;
      }

      const { rows } = await db.query(
        `SELECT c.id, c.title, c.body, c.media_url, c.media_type, c.sport, c.tags,
                c.like_count, c.view_count, c.comment_count, c.created_at,
                u.id AS author_id, u.display_name, u.username, u.avatar_url, u.slug AS author_slug
         FROM content c
         JOIN users u ON u.id = c.user_id
         WHERE c.status = 'approved' ${sportClause}
         ORDER BY c.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      const { rows: countRows } = await db.query(
        `SELECT COUNT(*) AS total FROM content c WHERE c.status = 'approved' ${sport ? `AND c.sport = '${sport}'` : ''}`,
      );

      res.json({
        content: rows,
        pagination: { page, limit, total: parseInt(countRows[0].total, 10) },
      });
    } catch (err) {
      logger.error('content.list error', { message: err.message });
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  }
);

// GET /api/content/:id  — single post
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, u.display_name, u.username, u.avatar_url, u.slug AS author_slug
       FROM content c JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 AND c.status = 'approved'`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Content not found' });

    await db.query('UPDATE content SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
    res.json({ content: rows[0] });
  } catch (err) {
    logger.error('content.get error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// POST /api/content  — creator creates post
router.post(
  '/',
  requireAuth,
  [
    body('title').optional().trim().isLength({ max: 200 }),
    body('body').optional().trim(),
    body('sport').optional().trim().isLength({ max: 50 }),
    body('media_url').optional().isURL(),
    body('media_type').optional().isIn(['image', 'video', 'audio', 'none']),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res) => {
    try {
      if (!req.user) return res.status(403).json({ error: 'Creator account required' });
      const { title, body: bodyText, sport, media_url, media_type, tags } = req.body;

      const { rows } = await db.query(
        `INSERT INTO content (user_id, title, body, sport, media_url, media_type, tags, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING *`,
        [req.user.id, title || null, bodyText || null, sport || null, media_url || null, media_type || 'none', tags || []]
      );

      auditLog({ actorId: req.user.id, actorType: 'creator', action: 'content.create', targetType: 'content', targetId: rows[0].id, ip: req.ip });
      res.status(201).json({ content: rows[0] });
    } catch (err) {
      logger.error('content.create error', { message: err.message });
      res.status(500).json({ error: 'Failed to create content' });
    }
  }
);

// PATCH /api/content/:id
router.patch(
  '/:id',
  requireAuth,
  [
    body('title').optional().trim().isLength({ max: 200 }),
    body('body').optional().trim(),
    body('sport').optional().trim(),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res) => {
    try {
      if (!req.user) return res.status(403).json({ error: 'Creator account required' });

      const { rows: existing } = await db.query(
        'SELECT id, user_id, status FROM content WHERE id = $1',
        [req.params.id]
      );
      if (!existing.length) return res.status(404).json({ error: 'Content not found' });
      if (existing[0].user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { title, body: bodyText, sport, tags } = req.body;
      const { rows } = await db.query(
        `UPDATE content
         SET title = COALESCE($1, title),
             body = COALESCE($2, body),
             sport = COALESCE($3, sport),
             tags = COALESCE($4, tags),
             status = 'pending',
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [title, bodyText, sport, tags, req.params.id]
      );

      auditLog({ actorId: req.user.id, actorType: req.user.role, action: 'content.update', targetType: 'content', targetId: req.params.id, ip: req.ip });
      res.json({ content: rows[0] });
    } catch (err) {
      logger.error('content.update error', { message: err.message });
      res.status(500).json({ error: 'Failed to update content' });
    }
  }
);

// DELETE /api/content/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(403).json({ error: 'Creator account required' });

    const { rows } = await db.query(
      'SELECT id, user_id FROM content WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Content not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('DELETE FROM content WHERE id = $1', [req.params.id]);
    auditLog({ actorId: req.user.id, actorType: req.user.role, action: 'content.delete', targetType: 'content', targetId: req.params.id, ip: req.ip });
    res.status(204).end();
  } catch (err) {
    logger.error('content.delete error', { message: err.message });
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;
