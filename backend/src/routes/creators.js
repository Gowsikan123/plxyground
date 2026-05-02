'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/creators
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    let sql = 'SELECT * FROM creators WHERE 1=1';
    const params = [];
    let idx = 1;
    if (search) { sql += ` AND (display_name ILIKE $${idx} OR username ILIKE $${idx+1})`; params.push(`%${search}%`, `%${search}%`); idx += 2; }
    if (sport) { sql += ` AND sport = $${idx}`; params.push(sport); idx++; }
    sql += ` ORDER BY follower_count DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(limit, offset);
    const rows = await db.prepare(sql).all(...params);
    const total = (await db.prepare('SELECT COUNT(*) as c FROM creators').get()).c;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/creators/slug/:slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const creator = await db.prepare('SELECT * FROM creators WHERE slug = $1').get(req.params.slug);
    if (!creator) return res.status(404).json({ success: false, error: 'Not found' });
    const posts = await db.prepare(`SELECT * FROM content WHERE creator_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20`).all(creator.id);
    return res.json({ success: true, data: { creator, posts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/creators/:id
router.get('/:id', async (req, res) => {
  try {
    const creator = await db.prepare('SELECT * FROM creators WHERE id = $1').get(req.params.id);
    if (!creator) return res.status(404).json({ success: false, error: 'Not found' });
    const posts = await db.prepare(`SELECT * FROM content WHERE creator_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20`).all(creator.id);
    return res.json({ success: true, data: { creator, posts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/creators/:id
router.put('/:id', requireAuth, [
  body('display_name').optional().trim().isLength({ min: 1, max: 60 }),
], validate, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Forbidden' });
    if (parseInt(req.params.id, 10) !== req.user.sub) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { display_name, bio, avatar_url, sport, location } = req.body;
    const creator = await db.prepare('SELECT * FROM creators WHERE id = $1').get(req.user.sub);
    if (!creator) return res.status(404).json({ success: false, error: 'Not found' });
    await db.prepare(
      `UPDATE creators SET display_name = $1, bio = $2, avatar_url = $3, sport = $4, location = $5 WHERE id = $6`
    ).run(display_name ?? creator.display_name, bio ?? creator.bio, avatar_url ?? creator.avatar_url, sport ?? creator.sport, location ?? creator.location, creator.id);
    const updated = await db.prepare('SELECT * FROM creators WHERE id = $1').get(creator.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
