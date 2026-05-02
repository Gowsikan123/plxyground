'use strict';
const express = require('express');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, sport, limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    const conditions = [];
    const params = [];
    let idx = 1;
    if (search) { conditions.push(`(c.display_name ILIKE $${idx} OR c.username ILIKE $${idx} OR c.bio ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (sport) { conditions.push(`c.sport ILIKE $${idx}`); params.push(sport); idx++; }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM creators c ${where}`, params);
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT c.id, c.username, c.slug, c.display_name, c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified, c.created_at FROM creators c ${where} ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    return res.json({ data: rows, total: countRes.rows[0].total, limit: lim, offset: off });
  } catch (err) {
    logger.error('GET /api/creators', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch creators.' });
  }
});

async function getCreatorWithPosts(res, whereClause, param) {
  const { rows } = await pool.query(
    `SELECT c.id, c.username, c.slug, c.display_name, c.bio, c.avatar_url, c.sport, c.location, c.follower_count, c.is_verified, c.created_at FROM creators c WHERE ${whereClause}`,
    [param]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Creator not found.' });
  const creator = rows[0];
  const posts = await pool.query(
    "SELECT * FROM content WHERE creator_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20",
    [creator.id]
  );
  return res.json({ creator, posts: posts.rows });
}

router.get('/slug/:slug', async (req, res) => {
  try { return await getCreatorWithPosts(res, 'c.slug = $1', req.params.slug); }
  catch (err) { logger.error('GET /api/creators/slug/:slug', { message: err.message }); return res.status(500).json({ error: 'Failed to fetch creator.' }); }
});

router.get('/:id', async (req, res) => {
  try { return await getCreatorWithPosts(res, 'c.id = $1', req.params.id); }
  catch (err) { logger.error('GET /api/creators/:id', { message: err.message }); return res.status(500).json({ error: 'Failed to fetch creator.' }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator access only.' });
  if (req.user.creator_id !== parseInt(req.params.id, 10)) return res.status(403).json({ error: 'Cannot edit another creator.' });
  try {
    const { display_name, bio, avatar_url, sport, location } = req.body;
    const { rows } = await pool.query(
      'UPDATE creators SET display_name=COALESCE($1,display_name), bio=COALESCE($2,bio), avatar_url=COALESCE($3,avatar_url), sport=COALESCE($4,sport), location=COALESCE($5,location) WHERE id=$6 RETURNING *',
      [display_name || null, bio || null, avatar_url || null, sport || null, location || null, req.params.id]
    );
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('PUT /api/creators/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
