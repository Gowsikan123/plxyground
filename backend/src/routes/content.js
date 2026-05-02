'use strict';

const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const audit = require('../utils/auditLogger');
const logger = require('../logger');

const contentValidation = [
  body('title').trim().isLength({ min: 1, max: 160 }),
  body('body').trim().isLength({ min: 1, max: 5000 }),
  body('content_type').isIn(['video', 'photo', 'article', 'highlight']),
  body('media_url').optional({ nullable: true }).isURL(),
];

// GET /api/content — public approved feed
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const sport = req.query.sport || null;
    const type = req.query.type || null;
    const creator_slug = req.query.creator || null;

    const conditions = [`c.status = 'approved'`];
    const params = [];

    if (sport) { params.push(sport); conditions.push(`cr.sport = $${params.length}`); }
    if (type) { params.push(type); conditions.push(`c.content_type = $${params.length}`); }
    if (creator_slug) { params.push(creator_slug); conditions.push(`cr.slug = $${params.length}`); }

    const where = conditions.join(' AND ');
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT c.id, c.title, c.body, c.media_url, c.content_type, c.created_at,
              cr.display_name, cr.username, cr.sport, cr.slug, cr.is_verified
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       WHERE ${where}
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ content: rows, limit, offset });
  } catch (err) {
    logger.error('Content feed error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content/:id — single post
router.get('/:id', param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });
  try {
    const { rows } = await db.query(
      `SELECT c.id, c.title, c.body, c.media_url, c.content_type, c.created_at,
              cr.display_name, cr.username, cr.sport, cr.slug, cr.is_verified, cr.bio
       FROM content c
       JOIN creators cr ON cr.id = c.creator_id
       WHERE c.id = $1 AND c.status = 'approved'`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Content not found' });
    return res.json({ content: rows[0] });
  } catch (err) {
    logger.error('Content get error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/content — creator creates post
router.post('/', requireAuth('creator'), contentValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { title, body, content_type, media_url } = req.body;

  try {
    const { rows } = await db.query(
      `INSERT INTO content (creator_id, title, body, content_type, media_url, status)
       VALUES ($1,$2,$3,$4,$5,'pending')
       RETURNING id, title, body, content_type, media_url, status, created_at`,
      [req.user.sub, title, body, content_type, media_url || null]
    );

    audit(req.user.sub, 'creator', 'content.create', { id: rows[0].id, title });
    logger.info('Content created', { creator_id: req.user.sub, content_id: rows[0].id });

    return res.status(201).json({ content: rows[0] });
  } catch (err) {
    logger.error('Content create error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/content/:id — creator updates own post
router.patch('/:id', requireAuth('creator'), param('id').isInt(), contentValidation, async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Validation failed' });

  const { title, body, content_type, media_url } = req.body;

  try {
    const check = await db.query(
      'SELECT id, creator_id FROM content WHERE id = $1',
      [req.params.id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Content not found' });
    if (check.rows[0].creator_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });

    const { rows } = await db.query(
      `UPDATE content SET title=$1, body=$2, content_type=$3, media_url=$4, status='pending', updated_at=NOW()
       WHERE id=$5
       RETURNING id, title, body, content_type, media_url, status, updated_at`,
      [title, body, content_type, media_url || null, req.params.id]
    );

    audit(req.user.sub, 'creator', 'content.update', { id: rows[0].id });
    return res.json({ content: rows[0] });
  } catch (err) {
    logger.error('Content update error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/content/:id — creator deletes own post
router.delete('/:id', requireAuth('creator'), param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });

  try {
    const check = await db.query('SELECT creator_id FROM content WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Content not found' });
    if (check.rows[0].creator_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });

    await db.query('DELETE FROM content WHERE id = $1', [req.params.id]);
    audit(req.user.sub, 'creator', 'content.delete', { id: req.params.id });
    return res.status(204).send();
  } catch (err) {
    logger.error('Content delete error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content/mine — creator's own posts (all statuses)
router.get('/mine', requireAuth('creator'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const { rows } = await db.query(
      `SELECT id, title, body, content_type, media_url, status, created_at, updated_at
       FROM content WHERE creator_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.sub, limit, offset]
    );
    return res.json({ content: rows, limit, offset });
  } catch (err) {
    logger.error('Content mine error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
