'use strict';

const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const audit = require('../utils/auditLogger');
const logger = require('../logger');

// GET /api/creators — public list
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const sport = req.query.sport || null;

    const params = [];
    let sportClause = '';
    if (sport) { params.push(sport); sportClause = `WHERE sport = $${params.length}`; }
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT id, username, display_name, sport, bio, location,
              instagram_handle, tiktok_handle, slug, follower_count, is_verified, created_at
       FROM creators
       ${sportClause}
       ORDER BY follower_count DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ creators: rows, limit, offset });
  } catch (err) {
    logger.error('Creators list error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/creators/slug/:slug — public profile by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, display_name, sport, bio, location,
              instagram_handle, tiktok_handle, slug, follower_count, is_verified, created_at
       FROM creators WHERE slug = $1 AND is_suspended = false`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('Creator by slug error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/creators/:id — public profile by id
router.get('/:id', param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });
  try {
    const { rows } = await db.query(
      `SELECT id, username, display_name, sport, bio, location,
              instagram_handle, tiktok_handle, slug, follower_count, is_verified, created_at
       FROM creators WHERE id = $1 AND is_suspended = false`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('Creator by id error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/creators/me — authenticated creator updates own profile
router.patch('/me', requireAuth('creator'), [
  body('display_name').optional().trim().isLength({ min: 1, max: 80 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('instagram_handle').optional().trim().isLength({ max: 60 }),
  body('tiktok_handle').optional().trim().isLength({ max: 60 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { display_name, bio, location, instagram_handle, tiktok_handle } = req.body;

  const fields = [];
  const values = [];

  if (display_name !== undefined) { values.push(display_name); fields.push(`display_name = $${values.length}`); }
  if (bio !== undefined) { values.push(bio); fields.push(`bio = $${values.length}`); }
  if (location !== undefined) { values.push(location); fields.push(`location = $${values.length}`); }
  if (instagram_handle !== undefined) { values.push(instagram_handle); fields.push(`instagram_handle = $${values.length}`); }
  if (tiktok_handle !== undefined) { values.push(tiktok_handle); fields.push(`tiktok_handle = $${values.length}`); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  values.push(req.user.sub);

  try {
    const { rows } = await db.query(
      `UPDATE creators SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, username, display_name, sport, bio, location, instagram_handle, tiktok_handle, slug`,
      values
    );

    audit(req.user.sub, 'creator', 'creator.update', { fields: Object.keys(req.body) });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('Creator update error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
