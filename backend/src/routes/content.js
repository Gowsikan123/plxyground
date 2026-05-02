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
], validate, async (req, res) => {
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
    let idx = 1;
    if (search) { sql += ` AND (c.title ILIKE $${idx} OR c.body ILIKE $${idx+1})`; params.push(`%${search}%`, `%${search}%`); idx += 2; }
    if (sport) { sql += ` AND cr.sport = $${idx}`; params.push(sport); idx++; }
    if (tags) { sql += ` AND c.tags ILIKE $${idx}`; params.push(`%${tags}%`); idx++; }
    sql += ` ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(limit, offset);

    const rows = await db.prepare(sql).all(...params);
    const total = (await db.prepare(`SELECT COUNT(*) as c FROM content WHERE status = 'published'`).get()).c;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/content/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await db.prepare(`
      SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug, cr.sport AS creator_sport, cr.avatar_url
      FROM content c JOIN creators cr ON cr.id = c.creator_id
      WHERE c.id = $1 AND c.status = 'published'
    `).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found' });
    await db.prepare('UPDATE content SET view_count = view_count + 1 WHERE id = $1').run(row.id);
    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/content
router.post('/', requireAuth, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('media_type').optional().isIn(['image', 'video', 'none']),
], validate, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags || null);
    const result = await db.prepare(
      `INSERT INTO content (creator_id, title, body, media_url, media_type, tags) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
    ).run(req.user.sub, title, bodyText || null, media_url || null, media_type || 'none', tagsStr);
    await db.prepare(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`).run(result.lastInsertRowid);
    const created = await db.prepare('SELECT * FROM content WHERE id = $1').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/content/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
    const row = await db.prepare('SELECT * FROM content WHERE id = $1 AND creator_id = $2').get(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    const { title, body: bodyText, media_url, media_type, tags } = req.body;
    const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (tags || row.tags);
    await db.prepare(
      `UPDATE content SET title = $1, body = $2, media_url = $3, media_type = $4, tags = $5, status = 'pending', updated_at = NOW() WHERE id = $6`
    ).run(title || row.title, bodyText ?? row.body, media_url ?? row.media_url, media_type || row.media_type, tagsStr, row.id);
    await db.prepare(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`).run(row.id);
    const updated = await db.prepare('SELECT * FROM content WHERE id = $1').get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/content/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
    const row = await db.prepare('SELECT * FROM content WHERE id = $1 AND creator_id = $2').get(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    await db.prepare(`UPDATE content SET status = 'deleted', updated_at = NOW() WHERE id = $1`).run(row.id);
    return res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
