'use strict';
const { Router } = require('express');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', (req, res) => {
  try {
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const params = [];
    let where = 'WHERE 1=1';
    if (search) {
      where += ' AND (c.display_name LIKE ? OR c.username LIKE ? OR c.bio LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (sport) {
      where += ' AND c.sport = ?';
      params.push(sport);
    }

    const creators = db.prepare(
      `SELECT c.id, c.username, c.slug, c.display_name, c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified, c.created_at
       FROM creators c ${where}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM creators c ${where}`).get(...params).count;
    return res.json({ success: true, data: { creators, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/slug/:slug', (req, res) => {
  try {
    const creator = db.prepare('SELECT * FROM creators WHERE slug = ?').get(req.params.slug);
    if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });
    const posts = db.prepare(
      'SELECT * FROM content WHERE creator_id = ? AND status = \'published\' ORDER BY created_at DESC LIMIT 20'
    ).all(creator.id);
    return res.json({ success: true, data: { creator, posts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
    if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });
    const posts = db.prepare(
      'SELECT * FROM content WHERE creator_id = ? AND status = \'published\' ORDER BY created_at DESC LIMIT 20'
    ).all(creator.id);
    return res.json({ success: true, data: { creator, posts } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access only.' });
    if (req.user.creator_id !== parseInt(req.params.id)) return res.status(403).json({ success: false, error: 'Forbidden.' });
    const current = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
    if (!current) return res.status(404).json({ success: false, error: 'Not found.' });
    const { display_name = current.display_name, bio = current.bio, avatar_url = current.avatar_url, sport = current.sport, location = current.location } = req.body;
    db.prepare('UPDATE creators SET display_name=?, bio=?, avatar_url=?, sport=?, location=? WHERE id=?')
      .run(display_name, bio, avatar_url, sport, location, current.id);
    const updated = db.prepare('SELECT * FROM creators WHERE id = ?').get(current.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
