'use strict';
const express = require('express');
const { body, query } = require('express-validator');
const pool = require('../db/client');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const audit = require('../utils/auditLogger');

const router = express.Router();

// GET /api/creators  — paginated public list
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
      const page   = parseInt(req.query.page  || '1',  10);
      const limit  = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;
      const sport  = req.query.sport  || null;
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

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const countRes = await pool.query(`SELECT COUNT(*) FROM creators ${where}`, params);
      const total = parseInt(countRes.rows[0].count, 10);

      params.push(limit, offset);
      const result = await pool.query(
        `SELECT id, username, slug, display_name, bio, avatar_url, sport, location,
                follower_count, is_verified, created_at
         FROM creators ${where}
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

// GET /api/creators/id/:id  — look up by numeric ID (needed by frontend when only ID is known)
router.get('/id/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid creator ID' });
    const result = await pool.query(
      'SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified, created_at FROM creators WHERE id=$1',
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Creator not found' });
    const creator = result.rows[0];
    const content = await pool.query(
      'SELECT id, title, body, media_url, media_type, tags, view_count, like_count, created_at FROM content WHERE creator_id=$1 AND is_published=TRUE ORDER BY created_at DESC LIMIT 20',
      [id]
    );
    return res.json({ creator, content: content.rows });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

// GET /api/creators/:slug  — public profile by slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified, created_at FROM creators WHERE slug=$1',
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Creator not found' });
    const creator = result.rows[0];
    const content = await pool.query(
      'SELECT id, title, body, media_url, media_type, tags, view_count, like_count, created_at FROM content WHERE creator_id=$1 AND is_published=TRUE ORDER BY created_at DESC LIMIT 20',
      [creator.id]
    );
    return res.json({ creator, content: content.rows });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

// PUT /api/creators/:id  — update own profile (creator auth required)
router.put(
  '/:id',
  requireAuth,
  [
    body('display_name').optional().trim().isLength({ min: 1, max: 100 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('sport').optional().trim().isLength({ max: 100 }),
    body('location').optional().trim().isLength({ max: 100 }),
    body('avatar_url').optional().isURL(),
    body('website_url').optional().isURL(),
    body('instagram_handle').optional().trim().isLength({ max: 50 }),
    body('tiktok_handle').optional().trim().isLength({ max: 50 }),
    body('youtube_handle').optional().trim().isLength({ max: 50 }),
  ],
  validate,
  async (req, res) => {
    try {
      if (req.userType !== 'creator') return res.status(403).json({ error: 'Creator account required' });
      const id = parseInt(req.params.id, 10);
      if (req.user.creator_id !== id) return res.status(403).json({ error: 'Cannot edit another creator\'s profile' });

      const allowed = ['display_name', 'bio', 'sport', 'location', 'avatar_url', 'website_url', 'instagram_handle', 'tiktok_handle', 'youtube_handle'];
      const fields = [];
      const params = [];
      let idx = 1;

      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          fields.push(`${key}=$${idx++}`);
          params.push(req.body[key]);
        }
      }

      if (!fields.length) return res.status(400).json({ error: 'No valid fields to update' });

      fields.push(`updated_at=NOW()`);
      params.push(id);

      const result = await pool.query(
        `UPDATE creators SET ${fields.join(', ')} WHERE id=$${idx} RETURNING id, username, slug, display_name, bio, avatar_url, sport, location, follower_count, is_verified, updated_at`,
        params
      );

      if (!result.rows.length) return res.status(404).json({ error: 'Creator not found' });

      await audit.log({
        actor_type: 'creator', actor_id: id,
        action: 'UPDATE_PROFILE', target_type: 'creator', target_id: id,
        ip_address: req.ip,
      });

      return res.json(result.rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

module.exports = router;
