'use strict';
const express = require('express');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (c.display_name LIKE ? OR c.username LIKE ? OR c.bio LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (sport) {
      where += ' AND c.sport = ?';
      params.push(sport);
    }

    const creators = db
      .prepare(`SELECT c.* FROM creators c ${where} ORDER BY c.follower_count DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) as n FROM creators c ${where}`).get(...params).n;

    return res.json({ success: true, data: { creators, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/slug/:slug', (req, res) => {
  try {
    const creator = db.prepare('SELECT * FROM creators WHERE slug = ?').get(req.params.slug);
    if (!creator) return res.status(404).json({ success: false, error: 'Creator not found' });

    const posts = db
      .prepare("SELECT * FROM content WHERE creator_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 20")
      .all(creator.id);

    return res.json({ success: true, data: { creator, posts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
    if (!creator) return res.status(404).json({ success: false, error: 'Creator not found' });

    const posts = db
      .prepare("SELECT * FROM content WHERE creator_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 20")
      .all(creator.id);

    return res.json({ success: true, data: { creator, posts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access required' });
    if (req.user.creator_id !== parseInt(req.params.id)) {
      return res.status(403).json({ success: false, error: 'Cannot update another creator profile' });
    }
    const { display_name, bio, avatar_url, sport, location } = req.body;
    const existing = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);

    db.prepare('UPDATE creators SET display_name=?, bio=?, avatar_url=?, sport=?, location=? WHERE id=?').run(
      display_name !== undefined ? display_name : existing.display_name,
      bio !== undefined ? bio : existing.bio,
      avatar_url !== undefined ? avatar_url : existing.avatar_url,
      sport !== undefined ? sport : existing.sport,
      location !== undefined ? location : existing.location,
      existing.id
    );

    const updated = db.prepare('SELECT * FROM creators WHERE id = ?').get(existing.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
