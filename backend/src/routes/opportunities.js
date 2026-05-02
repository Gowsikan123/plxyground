'use strict';

const express = require('express');
const { body, param, query } = require('express-validator');
const { getPool } = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { writeAudit } = require('../utils/auditLogger');
const logger = require('../logger');

const router = express.Router();

// GET /api/opportunities — public list
router.get(
  '/',
  [query('sport').optional().trim(), query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 50 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;
      const conditions = [`status = 'open'`];
      const params = [];

      if (req.query.sport) { params.push(req.query.sport); conditions.push(`sport = $${params.length}`); }

      params.push(limit, offset);
      const { rows } = await getPool().query(
        `SELECT * FROM opportunities WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );
      return res.json({ opportunities: rows, page, limit });
    } catch (err) {
      logger.error('list opportunities error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/opportunities/:id
router.get('/:id', [param('id').isInt().toInt()], validate, async (req, res) => {
  try {
    const { rows } = await getPool().query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    return res.json({ opportunity: rows[0] });
  } catch (err) {
    logger.error('get opportunity error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/opportunities
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().isLength({ min: 5, max: 200 }),
    body('description').trim().isLength({ min: 10, max: 2000 }),
    body('sport').optional().trim().isLength({ max: 50 }),
    body('budget').optional().trim().isLength({ max: 100 }),
    body('location').optional().trim().isLength({ max: 150 }),
    body('deadline').optional().isISO8601().toDate(),
    body('tags').optional().isArray({ max: 10 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, sport, budget, location, deadline, tags } = req.body;
      const { rows } = await getPool().query(
        `INSERT INTO opportunities (poster_id, poster_type, title, description, sport, budget, location, deadline, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [req.user.id, req.user.type, title, description, sport || null, budget || null, location || null, deadline || null, tags || []],
      );
      writeAudit({ actorId: req.user.id, actorType: req.user.type, action: 'create_opportunity', targetId: rows[0].id, targetType: 'opportunity', ip: req.ip });
      return res.status(201).json({ opportunity: rows[0] });
    } catch (err) {
      logger.error('create opportunity error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/opportunities/:id
router.patch(
  '/:id',
  requireAuth,
  [param('id').isInt().toInt(), body('title').optional().trim().isLength({ min: 5, max: 200 }), body('status').optional().isIn(['open', 'closed', 'filled'])],
  validate,
  async (req, res) => {
    try {
      const { rows: existing } = await getPool().query('SELECT poster_id, poster_type FROM opportunities WHERE id = $1', [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: 'Opportunity not found' });
      const opp = existing[0];
      if (opp.poster_id !== req.user.id || opp.poster_type !== req.user.type) return res.status(403).json({ error: 'Forbidden' });

      const { title, description, sport, budget, location, deadline, status, tags } = req.body;
      const { rows } = await getPool().query(
        `UPDATE opportunities SET
           title = COALESCE($1, title), description = COALESCE($2, description),
           sport = COALESCE($3, sport), budget = COALESCE($4, budget),
           location = COALESCE($5, location), deadline = COALESCE($6, deadline),
           status = COALESCE($7, status), tags = COALESCE($8, tags), updated_at = NOW()
         WHERE id = $9 RETURNING *`,
        [title || null, description || null, sport || null, budget || null, location || null, deadline || null, status || null, tags || null, req.params.id],
      );
      return res.json({ opportunity: rows[0] });
    } catch (err) {
      logger.error('update opportunity error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// DELETE /api/opportunities/:id
router.delete('/:id', requireAuth, [param('id').isInt().toInt()], validate, async (req, res) => {
  try {
    const { rows } = await getPool().query('SELECT poster_id, poster_type FROM opportunities WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    if (rows[0].poster_id !== req.user.id || rows[0].poster_type !== req.user.type) return res.status(403).json({ error: 'Forbidden' });

    await getPool().query('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
    writeAudit({ actorId: req.user.id, actorType: req.user.type, action: 'delete_opportunity', targetId: req.params.id, targetType: 'opportunity', ip: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('delete opportunity error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
