'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const audit = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    let where = "WHERE c.status = 'published'";
    const params = [];

    if (search) {
      where += ' AND (c.title LIKE ? OR c.body LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (sport) {
      where += ' AND cr.sport = ?';
      params.push(sport);
    }

    const posts = db
      .prepare(
        `SELECT c.*, cr.display_name, cr.username, cr.slug as creator_slug, cr.avatar_url, cr.sport
         FROM content c JOIN creators cr ON c.creator_id = cr.id
         ${where}
         ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset);

    const total = db
      .prepare(
        `SELECT COUNT(*) as n FROM content c JOIN creators cr ON c.creator_id = cr.id ${where}`
      )
      .get(...params).n;

    return res.json({ success: true, data: { posts, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const post = db
      .prepare(
        `SELECT c.*, cr.display_name, cr.username, cr.slug as creator_slug, cr.avatar_url, cr.sport
         FROM content c JOIN creators cr ON c.creator_id = cr.id
         WHERE c.id = ? AND c.status = 'published'`
      )
      .get(req.params.id);

    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    db.prepare('UPDATE content SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title required'),
    body('media_type').optional().isIn(['image', 'video', 'none']).withMessage('Invalid media_type'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access required' });
      const { title, body: bodyText = '', media_url = '', media_type = 'none', tags = [] } = req.body;
      const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

      const row = db
        .prepare(
          "INSERT INTO content (creator_id, title, body, media_url, media_type, tags, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')"
        )
        .run(req.user.creator_id, title, bodyText, media_url, media_type, tagsJson);

      db.prepare("INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', ?)").run(row.lastInsertRowid);
      audit.log({ actor_type: 'creator', actor_id: req.user.id, action: 'CONTENT_CREATED', target_type: 'content', target_id: row.lastInsertRowid, ip_address: req.ip });

      const created = db.prepare('SELECT * FROM content WHERE id = ?').get(row.lastInsertRowid);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access required' });
    const post = db.prepare('SELECT * FROM content WHERE id = ? AND creator_id = ?').get(req.params.id, req.user.creator_id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (['deleted', 'rejected'].includes(post.status)) {
      return res.status(400).json({ success: false, error: `Cannot edit a ${post.status} post` });
    }

    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const newTitle = title !== undefined ? title : post.title;
    const newBody = bodyText !== undefined ? bodyText : post.body;
    const newMedia = media_url !== undefined ? media_url : post.media_url;
    const newType = media_type !== undefined ? media_type : post.media_type;
    const newTags = tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : post.tags;

    let newStatus = post.status;
    if ((title !== undefined || bodyText !== undefined) && post.status === 'published') {
      newStatus = 'pending';
      db.prepare("INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', ?)").run(post.id);
    }

    db.prepare('UPDATE content SET title=?, body=?, media_url=?, media_type=?, tags=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(newTitle, newBody, newMedia, newType, newTags, newStatus, post.id);

    const updated = db.prepare('SELECT * FROM content WHERE id = ?').get(post.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access required' });
    const post = db.prepare('SELECT * FROM content WHERE id = ? AND creator_id = ?').get(req.params.id, req.user.creator_id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    db.prepare("UPDATE content SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(post.id);
    audit.log({ actor_type: 'creator', actor_id: req.user.id, action: 'CONTENT_DELETED', target_type: 'content', target_id: post.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
