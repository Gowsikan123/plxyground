'use strict';
const express = require('express');
const { body, query } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/content
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], validate, (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const tags = req.query.tags || '';

    let sql = `
      SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.sport AS creator_sport, cr.avatar_url
      FROM content c
      JOIN creators cr ON cr.id = c.creator_id
      WHERE c.status = 'published'
    `;
    const params = [];
    if (search) { sql += ` AND (c.title LIKE ? OR c.body LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (sport) { sql += ` AND cr.sport = ?`; params.push(sport); }
    if (tags) { sql += ` AND c.tags LIKE ?`; params.push(`%${tags}%`); }
    sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    const total = db.prepare(`SELECT COUNT(*) as c FROM content WHERE status = 'published'`).get().c;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/content/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.sport AS creator_sport, cr.avatar_url
      FROM content c JOIN creators cr ON cr.id = c.creator_id
      WHERE c.id = ? AND c.status = 'published'
    `).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found' });
    db.prepare('UPDATE content SET view_count = view_count + 1 WHERE id = ?').run(row.id);
    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/content
router.post('/', requireAuth, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('media_type').optional().isIn(['image', 'video', 'none']),
], validate, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags || null);
    const result = db.prepare(
      `INSERT INTO content (creator_id, title, body, media_url, media_type, tags) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.user.sub, title, bodyText || null, media_url || null, media_type || 'none', tagsStr);
    db.prepare(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', ?)`).run(result.lastInsertRowid);
    const created = db.prepare('SELECT * FROM content WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/content/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
    const row = db.prepare('SELECT * FROM content WHERE id = ? AND creator_id = ?').get(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags || row.tags);
    db.prepare(
      `UPDATE content SET title = ?, body = ?, media_url = ?, media_type = ?, tags = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(title || row.title, bodyText ?? row.body, media_url ?? row.media_url, media_type || row.media_type, tagsStr, row.id);
    db.prepare(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', ?)`).run(row.id);
    const updated = db.prepare('SELECT * FROM content WHERE id = ?').get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/content/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
    const row = db.prepare('SELECT * FROM content WHERE id = ? AND creator_id = ?').get(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    db.prepare(`UPDATE content SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(row.id);
    return res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
