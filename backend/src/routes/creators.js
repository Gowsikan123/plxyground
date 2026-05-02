'use strict';
const express = require('express');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, sport, limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    const params = [];
    const conditions = [];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(c.display_name ILIKE $${params.length} OR c.username ILIKE $${params.length} OR c.bio ILIKE $${params.length})`);
    }
    if (sport) {
      params.push(sport);
      conditions.push(`c.sport = $${params.length}`);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(lim, off);
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified FROM creators c ${where} ORDER BY follower_count DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      pool.query(`SELECT COUNT(*) FROM creators c ${where}`, params.slice(0, -2)),
    ]);
    return res.json({ data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10), limit: lim, offset: off });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified FROM creators WHERE slug = $1',
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Creator not found.' });
    const creator = rows[0];
    const { rows: posts } = await pool.query(
      "SELECT * FROM content WHERE creator_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20",
      [creator.id]
    );
    return res.json({ creator, posts });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified FROM creators WHERE id = $1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Creator not found.' });
    const creator = rows[0];
    const { rows: posts } = await pool.query(
      "SELECT * FROM content WHERE creator_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20",
      [creator.id]
    );
    return res.json({ creator, posts });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
    if (req.user.creator_id !== parseInt(req.params.id, 10)) {
      return res.status(403).json({ error: 'Cannot update another creator\'s profile.' });
    }
    const { display_name, bio, avatar_url, sport, location } = req.body;
    const { rows } = await pool.query(
      `UPDATE creators SET
        display_name = COALESCE($1, display_name),
        bio = COALESCE($2, bio),
        avatar_url = COALESCE($3, avatar_url),
        sport = COALESCE($4, sport),
        location = COALESCE($5, location)
       WHERE id = $6 RETURNING *`,
      [display_name || null, bio || null, avatar_url || null, sport || null, location || null, req.params.id]
    );
    return res.json({ creator: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
