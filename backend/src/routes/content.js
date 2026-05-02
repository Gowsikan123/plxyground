'use strict';
const express = require('express');
const { body, query } = require('express-validator');
const pool = require('../db/client');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const audit = require('../utils/auditLogger');

const router = express.Router();

// GET /api/content  — public feed
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('sport').optional().trim(),
    query('search').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const page   = parseInt(req.query.page  || '1',  10);
      const limit  = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;
      const sport  = req.query.sport  || null;
      const search = req.query.search || null;

      const conditions = ["co.is_published = TRUE"];
      const params = [];
      let idx = 1;

      if (sport) {
        conditions.push(`c.sport ILIKE $${idx++}`);
        params.push(`%${sport}%`);
      }
      if (search) {
        conditions.push(`(co.title ILIKE $${idx} OR co.body ILIKE $${idx + 1})`);
        params.push(`%${search}%`, `%${search}%`);
        idx += 2;
      }

      const where = conditions.join(' AND ');
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM content co JOIN creators c ON co.creator_id=c.id WHERE ${where}`,
        params
      );
      const total = parseInt(countRes.rows[0].count, 10);

      params.push(limit, offset);
      const result = await pool.query(
        `SELECT co.*, c.username, c.slug AS creator_slug, c.display_name, c.avatar_url, c.sport, c.is_verified
         FROM content co JOIN creators c ON co.creator_id=c.id
         WHERE ${where}
         ORDER BY co.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        params
      );

      return res.json({ data: result.rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch {
      return res.status(500).json({ error: 'Failed to fetch feed' });
    }
  }
);

// GET /api/content/:id  — single post
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid content ID' });
    const result = await pool.query(
      `SELECT co.*, c.username, c.slug AS creator_slug, c.display_name, c.avatar_url,
              c.sport, c.location AS creator_location, c.is_verified, c.follower_count
       FROM content co JOIN creators c ON co.creator_id=c.id
       WHERE co.id=$1 AND co.is_published=TRUE`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Content not found' });
    await pool.query('UPDATE content SET view_count=view_count+1 WHERE id=$1', [id]);
    return res.json(result.rows[0]);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// POST /api/content  — create
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
    body('body').trim().isLength({ min: 20 }).withMessage('Body must be at least 20 characters'),
    body('media_type').optional().isIn(['image', 'video', 'none']),
    body('media_url').optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator account required' });
      const { title, body: bodyText, media_url, media_type, tags } = req.body;
      const result = await pool.query(
        'INSERT INTO content (creator_id, title, body, media_url, media_type, tags) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [
          req.user.creator_id,
          title,
          bodyText,
          media_url || null,
          media_type || 'none',
          JSON.stringify(Array.isArray(tags) ? tags : []),
        ]
      );
      const content = result.rows[0];
      await pool.query(
        'INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)',
        ['creator_content', content.id]
      );
      await audit.log({
        actor_type: 'creator', actor_id: req.user.creator_id,
        action: 'CREATE_CONTENT', target_type: 'content', target_id: content.id,
        ip_address: req.ip,
      });
      return res.status(201).json(content);
    } catch {
      return res.status(500).json({ error: 'Failed to create content' });
    }
  }
);

// PUT /api/content/:id  — update (creator owns the post)
router.put(
  '/:id',
  requireAuth,
  [
    body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
    body('body').optional().trim().isLength({ min: 20 }).withMessage('Body must be at least 20 characters'),
    body('media_type').optional().isIn(['image', 'video', 'none']),
    body('media_url').optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator account required' });
      const id = parseInt(req.params.id, 10);
      const existing = await pool.query(
        'SELECT * FROM content WHERE id=$1 AND creator_id=$2',
        [id, req.user.creator_id]
      );
      if (!existing.rows.length) return res.status(404).json({ error: 'Content not found or not yours' });

      const { title, body: bodyText, media_url, media_type, tags } = req.body;
      const fields = [];
      const params = [];
      let idx = 1;

      if (title     !== undefined) { fields.push(`title=$${idx++}`);      params.push(title); }
      if (bodyText  !== undefined) { fields.push(`body=$${idx++}`);       params.push(bodyText); }
      if (media_url !== undefined) { fields.push(`media_url=$${idx++}`);  params.push(media_url); }
      if (media_type!== undefined) { fields.push(`media_type=$${idx++}`); params.push(media_type); }
      if (tags      !== undefined) { fields.push(`tags=$${idx++}`);       params.push(JSON.stringify(Array.isArray(tags) ? tags : [])); }

      if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

      // Re-enter moderation if content was published
      if (existing.rows[0].is_published) {
        fields.push(`is_published=FALSE`);
      }

      fields.push(`updated_at=NOW()`);
      params.push(id);

      const result = await pool.query(
        `UPDATE content SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`,
        params
      );

      if (existing.rows[0].is_published) {
        await pool.query(
          'INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)',
          ['creator_content', id]
        );
      }

      await audit.log({
        actor_type: 'creator', actor_id: req.user.creator_id,
        action: 'UPDATE_CONTENT', target_type: 'content', target_id: id,
        ip_address: req.ip,
      });

      return res.json(result.rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to update content' });
    }
  }
);

// DELETE /api/content/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator account required' });
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(
      'SELECT * FROM content WHERE id=$1 AND creator_id=$2',
      [id, req.user.creator_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Content not found or not yours' });
    await pool.query('UPDATE content SET is_published=FALSE, updated_at=NOW() WHERE id=$1', [id]);
    await audit.log({
      actor_type: 'creator', actor_id: req.user.creator_id,
      action: 'DELETE_CONTENT', target_type: 'content', target_id: id,
      ip_address: req.ip,
    });
    return res.json({ message: 'Content deleted' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete content' });
  }
});

module.exports = router;
