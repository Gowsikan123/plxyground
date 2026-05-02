'use strict';

const { Router } = require('express');
const { body, query } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const auditLog = require('../utils/auditLogger');

const router = Router();

// GET /api/opportunities
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
        `SELECT id, postedbytype, postedbyid, title, description, sport, location,
                budget, deadline, status, createdat, updatedat
         FROM opportunities
         WHERE status = 'published'
           AND ($1 = '' OR title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
           AND ($2 = '' OR sport ILIKE $2)
         ORDER BY createdat DESC
         LIMIT $3 OFFSET $4`,
        [search, sport, limit, offset]
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*) FROM opportunities
         WHERE status = 'published'
           AND ($1 = '' OR title ILIKE '%' || $1 || '%')
           AND ($2 = '' OR sport ILIKE $2)`,
        [search, sport]
      );

      return res.json({ opportunities: rows, total: parseInt(countRows[0].count, 10), limit, offset });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch opportunities', detail: err.message });
    }
  }
);

// GET /api/opportunities/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, postedbytype, postedbyid, title, description, sport, location,
              budget, deadline, status, createdat, updatedat
       FROM opportunities WHERE id = $1 AND status = 'published'`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    return res.json({ opportunity: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch opportunity', detail: err.message });
  }
});

// POST /api/opportunities
router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { type, id } = req.actor;
      if (type !== 'creator' && type !== 'business') {
        return res.status(403).json({ error: 'Auth required' });
      }
      const { title, description, sport, location, budget, deadline } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO opportunities (postedbytype, postedbyid, title, description, sport, location, budget, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [type, id, title, description, sport || null, location || null, budget || null, deadline || null]
      );
      auditLog({ actorType: type, actorId: id, action: 'OPPORTUNITY_CREATE', targetType: 'opportunities', targetId: rows[0].id });
      return res.status(201).json({ opportunity: rows[0] });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create opportunity', detail: err.message });
    }
  }
);

// PATCH /api/opportunities/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.actor;
    const { title, description, sport, location, budget, deadline, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE opportunities
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           sport = COALESCE($3, sport),
           location = COALESCE($4, location),
           budget = COALESCE($5, budget),
           deadline = COALESCE($6, deadline),
           status = COALESCE($7, status),
           updatedat = NOW()
       WHERE id = $8 AND postedbytype = $9 AND postedbyid = $10
       RETURNING *`,
      [title || null, description || null, sport || null, location || null,
       budget || null, deadline || null, status || null, req.params.id, type, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    return res.json({ opportunity: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update opportunity', detail: err.message });
  }
});

// DELETE /api/opportunities/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { type, id } = req.actor;
    const { rows } = await pool.query(
      `UPDATE opportunities SET status = 'deleted', updatedat = NOW()
       WHERE id = $1 AND postedbytype = $2 AND postedbyid = $3 RETURNING id`,
      [req.params.id, type, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    auditLog({ actorType: type, actorId: id, action: 'OPPORTUNITY_DELETE', targetType: 'opportunities', targetId: parseInt(req.params.id, 10) });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete opportunity', detail: err.message });
  }
});

module.exports = router;
