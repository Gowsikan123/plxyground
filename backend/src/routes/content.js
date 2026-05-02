'use strict';
const { Router } = require('express');
const { body, query } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../logger');

const router = Router();

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sport').optional().trim(),
], validate, (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const sport = req.query.sport;

    let baseQuery = `
      SELECT c.*, cr.display_name, cr.username, cr.slug as creator_slug, cr.avatar_url, cr.sport as creator_sport, cr.is_verified
      FROM content c
      JOIN creators cr ON c.creator_id = cr.id
      WHERE c.status = 'published'
    `;
    const params = [];
    if (sport) { baseQuery += ' AND cr.sport = ?'; params.push(sport); }
    baseQuery += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(baseQuery).all(...params);
    const total = db.prepare(`SELECT COUNT(*) as n FROM content c JOIN creators cr ON c.creator_id = cr.id WHERE c.status = 'published'${sport ? ' AND cr.sport = ?' : ''}`).get(...(sport ? [sport] : []));

    res.json({ data: rows.map(formatPost), meta: { page, limit, total: total.n } });
  } catch (err) {
    logger.error('Feed fetch error', { message: err.message });
    res.status(500).json({ error: 'Could not load feed.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const post = db.prepare(`
      SELECT c.*, cr.display_name, cr.username, cr.slug as creator_slug, cr.avatar_url, cr.is_verified
      FROM content c JOIN creators cr ON c.creator_id = cr.id
      WHERE c.id = ? AND c.status = 'published'
    `).get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    db.prepare('UPDATE content SET view_count = view_count + 1 WHERE id = ?').run(post.id);
    res.json({ data: formatPost(post) });
  } catch (err) {
    logger.error('Post fetch error', { message: err.message });
    res.status(500).json({ error: 'Could not load post.' });
  }
});

router.post('/', requireAuth('creator'), [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('body').optional().trim(),
  body('media_url').optional().trim(),
  body('media_type').optional().isIn(['image', 'video', 'none']),
  body('tags').optional().isArray(),
], validate, (req, res) => {
  try {
    const { title, body: bodyText = '', media_url = '', media_type = 'none', tags = [] } = req.body;
    const result = db.prepare(
      'INSERT INTO content (creator_id, title, body, media_url, media_type, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, title, bodyText, media_url, media_type, JSON.stringify(tags), 'pending');

    db.prepare(
      'INSERT INTO moderation_queue (content_type, content_id) VALUES (?, ?)'
    ).run('creator_content', result.lastInsertRowid);

    logAudit({ actorType: 'creator', actorId: req.user.id, action: 'content_submitted', targetType: 'content', targetId: result.lastInsertRowid, ipAddress: req.ip });

    const post = db.prepare('SELECT * FROM content WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: formatPost(post) });
  } catch (err) {
    logger.error('Content create error', { message: err.message });
    res.status(500).json({ error: 'Could not create post.' });
  }
});

router.delete('/:id', requireAuth('creator'), (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM content WHERE id = ? AND creator_id = ?').get(req.params.id, req.user.id);
    if (!post) return res.status(404).json({ error: 'Post not found or not yours.' });
    db.prepare('UPDATE content SET status = ? WHERE id = ?').run('deleted', post.id);
    logAudit({ actorType: 'creator', actorId: req.user.id, action: 'content_deleted', targetType: 'content', targetId: post.id, ipAddress: req.ip });
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    logger.error('Content delete error', { message: err.message });
    res.status(500).json({ error: 'Could not delete post.' });
  }
});

function formatPost(c) {
  return {
    ...c,
    tags: (() => { try { return JSON.parse(c.tags); } catch { return []; } })()
  };
}

module.exports = router;
