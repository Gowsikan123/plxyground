'use strict';
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/client');   // PostgreSQL — all tables live here
const audit = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');

const router = express.Router();

// GET /api/content
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const sport  = req.query.sport  || '';
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    let where  = "WHERE c.status = 'published'";
    const params = [];
    let idx = 1;

    if (search) {
      where += ` AND (c.title ILIKE $${idx} OR c.body ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (sport) {
      where += ` AND cr.sport = $${idx}`;
      params.push(sport);
      idx++;
    }

    const dataParams  = [...params, limit, offset];
    const countParams = [...params];

    const [postsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.avatar_url, cr.sport
         FROM content c JOIN creators cr ON c.creator_id = cr.id
         ${where}
         ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        dataParams
      ),
      pool.query(
        `SELECT COUNT(*) AS n FROM content c JOIN creators cr ON c.creator_id = cr.id ${where}`,
        countParams
      ),
    ]);

    return res.json({
      success: true,
      data: {
        posts:  postsResult.rows,
        total:  parseInt(countResult.rows[0].n, 10),
        limit,
        offset,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/content/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.avatar_url, cr.sport
       FROM content c JOIN creators cr ON c.creator_id = cr.id
       WHERE c.id = $1 AND c.status = 'published'`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Post not found' });
    await pool.query('UPDATE content SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/content
router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title required'),
    body('media_type').optional().isIn(['image', 'video', 'none']).withMessage('Invalid media_type'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      if (req.userType !== 'creator') {
        return res.status(403).json({ success: false, error: 'Creator access required' });
      }
      const { title, body: bodyText = '', media_url = '', media_type = 'none', tags = [] } = req.body;
      const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

      const { rows: contentRows } = await pool.query(
        `INSERT INTO content (creator_id, title, body, media_url, media_type, tags, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [req.user.creator_id, title, bodyText, media_url, media_type, tagsJson]
      );
      const created = contentRows[0];

      // content_type = 'content' matches the admin /queue JOIN
      await pool.query(
        "INSERT INTO moderation_queue (content_type, content_id) VALUES ('content', $1)",
        [created.id]
      );

      await audit.log({
        actor_type: 'creator', actor_id: req.user.id,
        action: 'CONTENT_CREATED', target_type: 'content', target_id: created.id,
        ip_address: req.ip,
      });

      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// PUT /api/content/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }
    const { rows: existing } = await pool.query(
      'SELECT * FROM content WHERE id = $1 AND creator_id = $2',
      [req.params.id, req.user.creator_id]
    );
    const post = existing[0];
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (['deleted', 'rejected'].includes(post.status)) {
      return res.status(400).json({ success: false, error: `Cannot edit a ${post.status} post` });
    }

    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const newTitle = title      !== undefined ? title      : post.title;
    const newBody  = bodyText   !== undefined ? bodyText   : post.body;
    const newMedia = media_url  !== undefined ? media_url  : post.media_url;
    const newType  = media_type !== undefined ? media_type : post.media_type;
    const newTags  = tags       !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : post.tags;

    let newStatus = post.status;
    if ((title !== undefined || bodyText !== undefined) && post.status === 'published') {
      newStatus = 'pending';
      await pool.query(
        "INSERT INTO moderation_queue (content_type, content_id) VALUES ('content', $1)",
        [post.id]
      );
    }

    const { rows: updated } = await pool.query(
      'UPDATE content SET title=$1, body=$2, media_url=$3, media_type=$4, tags=$5, status=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [newTitle, newBody, newMedia, newType, newTags, newStatus, post.id]
    );
    return res.json({ success: true, data: updated[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/content/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') {
      return res.status(403).json({ success: false, error: 'Creator access required' });
    }
    const { rows } = await pool.query(
      'SELECT * FROM content WHERE id = $1 AND creator_id = $2',
      [req.params.id, req.user.creator_id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Post not found' });
    await pool.query(
      "UPDATE content SET status='deleted', updated_at=NOW() WHERE id=$1",
      [req.params.id]
    );
    await audit.log({
      actor_type: 'creator', actor_id: req.user.id,
      action: 'CONTENT_DELETED', target_type: 'content', target_id: req.params.id,
      ip_address: req.ip,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
