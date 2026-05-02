'use strict';
const express = require('express');
const { query } = require('express-validator');
const pool = require('../db/client');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('sport').optional().trim(),
    query('search').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;
      const sport = req.query.sport || null;
      const search = req.query.search || null;

      const conditions = [];
      const params = [];
      let idx = 1;

      if (sport) {
        conditions.push(`sport ILIKE $${idx++}`);
        params.push(`%${sport}%`);
      }
      if (search) {
        conditions.push(`(username ILIKE $${idx} OR display_name ILIKE $${idx + 1} OR bio ILIKE $${idx + 2})`);
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        idx += 3;
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const countRes = await pool.query(`SELECT COUNT(*) FROM creators ${whereClause}`, params);
      const total = parseInt(countRes.rows[0].count, 10);

      params.push(limit, offset);
      const result = await pool.query(
        `SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified, created_at
         FROM creators ${whereClause}
         ORDER BY follower_count DESC, created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        params
      );

      return res.json({ data: result.rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch {
      return res.status(500).json({ error: 'Failed to fetch creators' });
    }
  }
);

router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified, created_at FROM creators WHERE slug=$1',
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Creator not found' });
    const creator = result.rows[0];
    const content = await pool.query(
      "SELECT id, title, body, media_url, media_type, tags, view_count, like_count, created_at FROM content WHERE creator_id=$1 AND status='published' ORDER BY created_at DESC LIMIT 20",
      [creator.id]
    );
    return res.json({ creator, content: content.rows });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

module.exports = router;
