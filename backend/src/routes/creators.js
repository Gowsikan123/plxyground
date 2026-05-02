'use strict';

const { Router } = require('express');
const { query } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

// GET /api/creators
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const search = req.query.search || '';
      const sport = req.query.sport || '';

      const { rows } = await pool.query(
        `SELECT id, username, slug, displayname, bio, avatarurl, sport, location,
                followercount, isverified, createdat
         FROM creators
         WHERE ($1 = '' OR displayname ILIKE '%' || $1 || '%' OR username ILIKE '%' || $1 || '%')
           AND ($2 = '' OR sport ILIKE $2)
         ORDER BY followercount DESC
         LIMIT $3 OFFSET $4`,
        [search, sport, limit, offset]
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*) FROM creators
         WHERE ($1 = '' OR displayname ILIKE '%' || $1 || '%' OR username ILIKE '%' || $1 || '%')
           AND ($2 = '' OR sport ILIKE $2)`,
        [search, sport]
      );

      return res.json({ creators: rows, total: parseInt(countRows[0].count, 10), limit, offset });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch creators', detail: err.message });
    }
  }
);

// GET /api/creators/slug/:slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, slug, displayname, bio, avatarurl, sport, location,
              followercount, isverified, createdat
       FROM creators WHERE slug = $1`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch creator', detail: err.message });
  }
});

// GET /api/creators/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, slug, displayname, bio, avatarurl, sport, location,
              followercount, isverified, createdat
       FROM creators WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch creator', detail: err.message });
  }
});

// PATCH /api/creators/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    if (req.actor.type !== 'creator' || req.actor.id !== parseInt(req.params.id, 10)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { displayname, bio, avatarurl, sport, location } = req.body;
    const { rows } = await pool.query(
      `UPDATE creators
       SET displayname = COALESCE($1, displayname),
           bio = COALESCE($2, bio),
           avatarurl = COALESCE($3, avatarurl),
           sport = COALESCE($4, sport),
           location = COALESCE($5, location)
       WHERE id = $6
       RETURNING id, username, slug, displayname, bio, avatarurl, sport, location, followercount, isverified, createdat`,
      [displayname || null, bio || null, avatarurl || null, sport || null, location || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile', detail: err.message });
  }
});

module.exports = router;
