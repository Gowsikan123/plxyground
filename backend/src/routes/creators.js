'use strict';
const express = require('express');
const { param, body, query: qv } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { slugify, uniqueSlug } = require('../utils/slugify');
const logger = require('../logger');

// GET /api/creators
router.get(
  '/',
  [qv('sport').optional().trim(), qv('page').optional().isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const page  = parseInt(req.query.page  || '1', 10);
      const limit = 20;
      const offset = (page - 1) * limit;
      const sport = req.query.sport || null;

      const params = [];
      let where = 'WHERE is_suspended = FALSE';
      if (sport) { where += ' AND sport = $1'; params.push(sport); }

      const sql = `SELECT id, username, display_name, bio, avatar_url, sport, slug, is_verified, follower_count
                   FROM users ${where}
                   ORDER BY follower_count DESC LIMIT ${limit} OFFSET ${offset}`;
      const result = await db.query(sql, params);
      return res.json({ creators: result.rows, page, limit });
    } catch (err) {
      logger.error('creators.list error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/creators/:slug
router.get('/slug/:slug', [param('slug').trim()], validate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, display_name, bio, avatar_url, sport, slug, is_verified, follower_count, created_at
       FROM users WHERE slug = $1 AND is_suspended = FALSE`,
      [req.params.slug],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: result.rows[0] });
  } catch (err) {
    logger.error('creators.bySlug error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/creators/:id
router.get('/:id', [param('id').isInt()], validate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, display_name, bio, avatar_url, sport, slug, is_verified, follower_count, created_at
       FROM users WHERE id = $1 AND is_suspended = FALSE`,
      [req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: result.rows[0] });
  } catch (err) {
    logger.error('creators.byId error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/creators/me
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
    try {
      const { display_name, bio, sport, avatar_url } = req.body;
      let slug = undefined;
      if (display_name) {
        const base = slugify(display_name);
        slug = await uniqueSlug(base, 'users', req.user.id);
      }
      const result = await db.query(
        `UPDATE users SET
           display_name = COALESCE($1, display_name),
           bio          = COALESCE($2, bio),
           sport        = COALESCE($3, sport),
           avatar_url   = COALESCE($4, avatar_url),
           slug         = COALESCE($5, slug),
           updated_at   = NOW()
         WHERE id = $6
         RETURNING id, username, email, display_name, bio, avatar_url, sport, slug, is_verified, follower_count`,
        [display_name, bio, sport, avatar_url, slug || null, req.user.id],
      );
      return res.json({ creator: result.rows[0] });
    } catch (err) {
      logger.error('creators.update error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
