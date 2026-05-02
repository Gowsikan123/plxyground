'use strict';

const express = require('express');
const { getPool } = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const pool = getPool();
  const { search, sport, limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = parseInt(offset, 10) || 0;
  try {
    const conditions = [];
    const params = [];
    let idx = 1;
    if (search) {
      conditions.push(`(display_name ILIKE $${idx} OR username ILIKE $${idx} OR bio ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (sport) {
      conditions.push(`sport ILIKE $${idx}`);
      params.push(`%${sport}%`);
      idx++;
    }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const countRes = await pool.query(`SELECT COUNT(*) FROM creators ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    params.push(safeLimit);
    params.push(safeOffset);
    const { rows } = await pool.query(
      `SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified, created_at FROM creators ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    return res.json({ data: rows, total, limit: safeLimit, offset: safeOffset });
  } catch (err) {
    throw err;
  }
});

router.get('/slug/:slug', async (req, res) => {
  const pool = getPool();
  const { slug } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified, created_at FROM creators WHERE slug = $1`,
      [slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    const creator = rows[0];
    const { rows: posts } = await pool.query(
      `SELECT * FROM content WHERE creator_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20`,
      [creator.id]
    );
    return res.json({ creator, posts });
  } catch (err) {
    throw err;
  }
});

router.get('/:id', async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified, created_at FROM creators WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    const creator = rows[0];
    const { rows: posts } = await pool.query(
      `SELECT * FROM content WHERE creator_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20`,
      [creator.id]
    );
    return res.json({ creator, posts });
  } catch (err) {
    throw err;
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator auth required' });
  const { id } = req.params;
  if (req.user.creator_id !== parseInt(id, 10)) return res.status(403).json({ error: 'Not authorised to update this profile' });
  const pool = getPool();
  const { display_name, bio, avatar_url, sport, location } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE creators SET display_name = COALESCE($1, display_name), bio = COALESCE($2, bio), avatar_url = COALESCE($3, avatar_url), sport = COALESCE($4, sport), location = COALESCE($5, location) WHERE id = $6 RETURNING *`,
      [display_name || null, bio || null, avatar_url || null, sport || null, location || null, id]
    );
    return res.json({ creator: rows[0] });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
