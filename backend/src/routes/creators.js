'use strict';

const express = require('express');
const { body, query: qv } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const { uniqueUserSlug } = require('../utils/slugify');
const auditLog = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const logger = require('../logger');

// GET /api/creators  — list all creators
router.get(
  '/',
  [
    qv('page').optional().isInt({ min: 1 }).toInt(),
    qv('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    qv('sport').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const sport = req.query.sport || null;

      const params = [limit, offset];
      let sportClause = '';
      if (sport) {
        params.push(sport);
        sportClause = `AND sport = $${params.length}`;
      }

      const { rows } = await db.query(
        `SELECT id, username, display_name, bio, avatar_url, sport, position, location,
                follower_count, is_verified, slug, created_at
         FROM users
         WHERE role = 'creator' AND is_suspended = FALSE ${sportClause}
         ORDER BY follower_count DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      res.json({ creators: rows, pagination: { page, limit } });
    } catch (err) {
      logger.error('creators.list error', { message: err.message });
      res.status(500).json({ error: 'Failed to fetch creators' });
    }
  }
);

// GET /api/creators/:slug  — public profile by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, display_name, bio, avatar_url, sport, position, location,
              follower_count, following_count, is_verified, slug, created_at
       FROM users WHERE slug = $1 AND role = 'creator' AND is_suspended = FALSE`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Creator not found' });
    res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('creators.bySlug error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

// GET /api/creators/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, display_name, bio, avatar_url, sport, position, location,
              follower_count, following_count, is_verified, slug, created_at
       FROM users WHERE id = $1 AND role = 'creator' AND is_suspended = FALSE`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Creator not found' });
    res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('creators.byId error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

// PATCH /api/creators/me  — update own profile
router.patch(
  '/me',
  requireAuth,
  [
    body('display_name').optional().trim().isLength({ max: 100 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('sport').optional().trim().isLength({ max: 50 }),
    body('position').optional().trim().isLength({ max: 50 }),
    body('location').optional().trim().isLength({ max: 100 }),
    body('avatar_url').optional().isURL(),
  ],
  validate,
  async (req, res) => {
    try {
      if (!req.user) return res.status(403).json({ error: 'Creator account required' });
      const { display_name, bio, sport, position, location, avatar_url } = req.body;

      let slug;
      if (display_name) {
        slug = await uniqueUserSlug(display_name, req.user.id);
      }

      const { rows } = await db.query(
        `UPDATE users
         SET display_name = COALESCE($1, display_name),
             bio = COALESCE($2, bio),
             sport = COALESCE($3, sport),
             position = COALESCE($4, position),
             location = COALESCE($5, location),
             avatar_url = COALESCE($6, avatar_url),
             slug = COALESCE($7, slug),
             updated_at = NOW()
         WHERE id = $8
         RETURNING id, username, display_name, bio, avatar_url, sport, position, location, slug`,
        [display_name, bio, sport, position, location, avatar_url, slug || null, req.user.id]
      );

      auditLog({ actorId: req.user.id, actorType: 'creator', action: 'creator.profile.update', ip: req.ip });
      res.json({ creator: rows[0] });
    } catch (err) {
      logger.error('creators.updateMe error', { message: err.message });
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

module.exports = router;
