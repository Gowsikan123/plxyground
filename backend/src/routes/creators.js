'use strict';

const express = require('express');
const { param, body, query } = require('express-validator');
const { getPool } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uniqueSlug } = require('../utils/slugify');
const logger = require('../logger');

const router = express.Router();

// GET /api/creators — list all (public)
router.get(
  '/',
  [query('sport').optional().trim(), query('search').optional().trim(), query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 50 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const conditions = ['is_suspended = FALSE'];
      const params = [];

      if (req.query.sport) { params.push(req.query.sport); conditions.push(`sport = $${params.length}`); }
      if (req.query.search) { params.push(`%${req.query.search}%`); conditions.push(`(username ILIKE $${params.length} OR display_name ILIKE $${params.length})`); }

      params.push(limit, offset);
      const { rows } = await getPool().query(
        `SELECT id, username, display_name, bio, sport, avatar_url, slug, follower_count, is_verified, created_at
         FROM creators WHERE ${conditions.join(' AND ')}
         ORDER BY follower_count DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );
      return res.json({ creators: rows, page, limit });
    } catch (err) {
      logger.error('list creators error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/creators/:id
router.get('/:id', [param('id').isInt().toInt()], validate, async (req, res) => {
  try {
    const { rows } = await getPool().query(
      'SELECT id, username, display_name, bio, sport, avatar_url, slug, follower_count, is_verified, created_at FROM creators WHERE id = $1 AND is_suspended = FALSE',
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('get creator error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/creators/slug/:slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { rows } = await getPool().query(
      'SELECT id, username, display_name, bio, sport, avatar_url, slug, follower_count, is_verified, created_at FROM creators WHERE slug = $1 AND is_suspended = FALSE',
      [req.params.slug],
    );
    if (!rows.length) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('get creator by slug error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/creators/me — update own profile
router.patch(
  '/me',
  requireAuth,
  [
    body('display_name').optional().trim().isLength({ max: 100 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('sport').optional().trim().isLength({ max: 50 }),
    body('avatar_url').optional().isURL(),
  ],
  validate,
  async (req, res) => {
    if (req.user.type !== 'creator') return res.status(403).json({ error: 'Not a creator account' });
    try {
      const { display_name, bio, sport, avatar_url } = req.body;
      let slug = undefined;
      if (display_name) slug = await uniqueSlug(display_name, 'creators', 'slug', req.user.id);

      const { rows } = await getPool().query(
        `UPDATE creators SET
           display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           sport = COALESCE($3, sport),
           avatar_url = COALESCE($4, avatar_url),
           slug = COALESCE($5, slug),
           updated_at = NOW()
         WHERE id = $6
         RETURNING id, username, display_name, bio, sport, avatar_url, slug`,
        [display_name || null, bio || null, sport || null, avatar_url || null, slug || null, req.user.id],
      );
      return res.json({ creator: rows[0] });
    } catch (err) {
      logger.error('update creator error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
