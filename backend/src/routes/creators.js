'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/creators
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    let sql = 'SELECT * FROM creators WHERE 1=1';
    const params = [];
    if (search) { sql += ' AND (display_name LIKE ? OR username LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (sport) { sql += ' AND sport = ?'; params.push(sport); }
    sql += ' ORDER BY follower_count DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = db.prepare(sql).all(...params);
    const total = db.prepare('SELECT COUNT(*) as c FROM creators').get().c;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/creators/slug/:slug
router.get('/slug/:slug', (req, res) => {
  try {
    const creator = db.prepare('SELECT * FROM creators WHERE slug = ?').get(req.params.slug);
    if (!creator) return res.status(404).json({ success: false, error: 'Not found' });
    const posts = db.prepare(`SELECT * FROM content WHERE creator_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 20`).all(creator.id);
    return res.json({ success: true, data: { creator, posts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/creators/:id
router.get('/:id', (req, res) => {
  try {
    const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
    if (!creator) return res.status(404).json({ success: false, error: 'Not found' });
    const posts = db.prepare(`SELECT * FROM content WHERE creator_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 20`).all(creator.id);
    return res.json({ success: true, data: { creator, posts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/creators/:id
router.put('/:id', requireAuth, [
  body('display_name').optional().trim().isLength({ min: 1, max: 60 }),
], validate, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
    if (parseInt(req.params.id, 10) !== req.user.sub) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { display_name, bio, avatar_url, sport, location } = req.body;
    const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.user.sub);
    if (!creator) return res.status(404).json({ success: false, error: 'Not found' });
    db.prepare(
      `UPDATE creators SET display_name = ?, bio = ?, avatar_url = ?, sport = ?, location = ? WHERE id = ?`
    ).run(display_name ?? creator.display_name, bio ?? creator.bio, avatar_url ?? creator.avatar_url, sport ?? creator.sport, location ?? creator.location, creator.id);
    const updated = db.prepare('SELECT * FROM creators WHERE id = ?').get(creator.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
