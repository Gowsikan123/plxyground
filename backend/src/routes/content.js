'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const audit = require('../utils/auditLogger');

const router = Router();

router.get('/', (req, res) => {
  try {
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const params = [];
    let where = 'WHERE c.status = \'published\'';
    if (search) {
      where += ' AND (c.title LIKE ? OR c.body LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (sport) {
      where += ' AND cr.sport = ?';
      params.push(sport);
    }

    const posts = db.prepare(
      `SELECT c.*, cr.display_name, cr.username, cr.slug as creator_slug, cr.avatar_url, cr.sport
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const total = db.prepare(
      `SELECT COUNT(*) as count FROM content c JOIN creators cr ON cr.id = c.creator_id ${where}`
    ).get(...params).count;

    return res.json({ success: true, data: { posts, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const post = db.prepare(
      `SELECT c.*, cr.display_name, cr.username, cr.slug as creator_slug, cr.avatar_url, cr.sport
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       WHERE c.id = ? AND c.status = 'published'`
    ).get(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
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
    body('title').notEmpty().withMessage('Title is required'),
    body('media_type').optional().isIn(['image', 'video', 'none']).withMessage('Invalid media_type'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access only.' });
      const { title, body: bodyText = '', media_url = '', media_type = 'none', tags = [] } = req.body;
      const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
      const result = db.prepare(
        'INSERT INTO content (creator_id, title, body, media_url, media_type, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(req.user.creator_id, title, bodyText, media_url, media_type, tagsJson, 'pending');
      db.prepare('INSERT INTO moderation_queue (content_type, content_id) VALUES (?, ?)').run('creator_content', result.lastInsertRowid);
      audit.log({ actor_type: 'creator', actor_id: req.user.id, action: 'CONTENT_CREATED', target_type: 'content', target_id: result.lastInsertRowid, ip_address: req.ip });
      const row = db.prepare('SELECT * FROM content WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json({ success: true, data: row });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access only.' });
    const row = db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found.' });
    if (row.creator_id !== req.user.creator_id) return res.status(403).json({ success: false, error: 'Forbidden.' });
    if (row.status === 'deleted' || row.status === 'rejected') return res.status(400).json({ success: false, error: 'Cannot edit deleted or rejected content.' });
    const { title = row.title, body: bodyText = row.body, media_url = row.media_url, media_type = row.media_type, tags } = req.body;
    const tagsJson = tags ? JSON.stringify(Array.isArray(tags) ? tags : []) : row.tags;
    const contentChanged = title !== row.title || bodyText !== row.body;
    const newStatus = contentChanged && row.status === 'published' ? 'pending' : row.status;
    db.prepare('UPDATE content SET title=?, body=?, media_url=?, media_type=?, tags=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(title, bodyText, media_url, media_type, tagsJson, newStatus, row.id);
    if (contentChanged && row.status === 'published') {
      db.prepare('INSERT INTO moderation_queue (content_type, content_id) VALUES (?, ?)').run('creator_content', row.id);
    }
    const updated = db.prepare('SELECT * FROM content WHERE id = ?').get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access only.' });
    const row = db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found.' });
    if (row.creator_id !== req.user.creator_id) return res.status(403).json({ success: false, error: 'Forbidden.' });
    db.prepare('UPDATE content SET status = ? WHERE id = ?').run('deleted', row.id);
    audit.log({ actor_type: 'creator', actor_id: req.user.id, action: 'CONTENT_DELETED', target_type: 'content', target_id: row.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
