'use strict';
const express = require('express');
const { body, param, query: qv } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const { validate } = require('../middleware/validate');
const { requireAuth, requireBusiness } = require('../middleware/auth');
const { auditLog } = require('../utils/auditLogger');
const logger = require('../logger');

// GET /api/opportunities  — public
router.get(
  '/',
  [qv('sport').optional().trim(), qv('type').optional().trim(), qv('page').optional().isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const page   = parseInt(req.query.page || '1', 10);
      const limit  = 20;
      const offset = (page - 1) * limit;

      const params = ['open'];
      let where = 'WHERE o.status = $1';
      if (req.query.sport) { where += ` AND o.sport = $${params.push(req.query.sport)}`; }
      if (req.query.type)  { where += ` AND o.type  = $${params.push(req.query.type)}`; }

      const sql = `
        SELECT o.id, o.title, o.description, o.sport, o.type, o.budget_min, o.budget_max,
               o.deadline, o.location, o.remote_ok, o.applications_count, o.created_at,
               b.id AS business_id, b.name AS business_name, b.logo_url, b.slug AS business_slug
        FROM opportunities o
        JOIN businesses b ON b.id = o.business_id
        ${where}
        ORDER BY o.created_at DESC
        LIMIT ${limit} OFFSET ${offset}`;

      const result = await db.query(sql, params);
      return res.json({ opportunities: result.rows, page, limit });
    } catch (err) {
      logger.error('opportunities.list error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/opportunities/:id
router.get('/:id', [param('id').isInt()], validate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, b.name AS business_name, b.logo_url, b.slug AS business_slug
       FROM opportunities o JOIN businesses b ON b.id = o.business_id
       WHERE o.id = $1`,
      [req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    return res.json({ opportunity: result.rows[0] });
  } catch (err) {
    logger.error('opportunities.get error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/opportunities  — business creates
router.post(
  '/',
  requireBusiness,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required'),
    body('description').trim().isLength({ min: 1 }).withMessage('Description required'),
    body('type').isIn(['sponsorship', 'collab', 'ambassador', 'appearance', 'other']).withMessage('Invalid type'),
    body('sport').optional().trim(),
    body('budget_min').optional().isFloat({ min: 0 }),
    body('budget_max').optional().isFloat({ min: 0 }),
    body('deadline').optional().isDate(),
    body('remote_ok').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, type, sport, budget_min, budget_max, deadline, location, remote_ok } = req.body;
      const result = await db.query(
        `INSERT INTO opportunities (business_id, title, description, type, sport, budget_min, budget_max, deadline, location, remote_ok)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [req.business.id, title, description, type, sport || null, budget_min || null, budget_max || null, deadline || null, location || null, remote_ok ?? false],
      );
      auditLog({ actorId: req.business.id, actorType: 'business', action: 'opportunity.create', targetType: 'opportunity', targetId: result.rows[0].id, ip: req.ip });
      return res.status(201).json({ opportunity: result.rows[0] });
    } catch (err) {
      logger.error('opportunities.create error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/opportunities/:id
router.patch(
  '/:id',
  requireBusiness,
  [param('id').isInt(), body('status').optional().isIn(['open', 'closed', 'draft'])],
  validate,
  async (req, res) => {
    try {
      const own = await db.query('SELECT id, business_id FROM opportunities WHERE id = $1', [req.params.id]);
      if (!own.rows.length) return res.status(404).json({ error: 'Opportunity not found' });
      if (own.rows[0].business_id !== req.business.id) return res.status(403).json({ error: 'Forbidden' });

      const { title, description, sport, budget_min, budget_max, deadline, location, remote_ok, status } = req.body;
      const result = await db.query(
        `UPDATE opportunities SET
           title       = COALESCE($1, title),
           description = COALESCE($2, description),
           sport       = COALESCE($3, sport),
           budget_min  = COALESCE($4, budget_min),
           budget_max  = COALESCE($5, budget_max),
           deadline    = COALESCE($6, deadline),
           location    = COALESCE($7, location),
           remote_ok   = COALESCE($8, remote_ok),
           status      = COALESCE($9, status),
           updated_at  = NOW()
         WHERE id = $10 RETURNING *`,
        [title, description, sport, budget_min, budget_max, deadline, location, remote_ok, status, req.params.id],
      );
      return res.json({ opportunity: result.rows[0] });
    } catch (err) {
      logger.error('opportunities.update error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// DELETE /api/opportunities/:id
router.delete('/:id', requireBusiness, [param('id').isInt()], validate, async (req, res) => {
  try {
    const own = await db.query('SELECT id, business_id FROM opportunities WHERE id = $1', [req.params.id]);
    if (!own.rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    if (own.rows[0].business_id !== req.business.id) return res.status(403).json({ error: 'Forbidden' });
    await db.query('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
    auditLog({ actorId: req.business.id, actorType: 'business', action: 'opportunity.delete', targetType: 'opportunity', targetId: parseInt(req.params.id, 10), ip: req.ip });
    return res.json({ success: true });
  } catch (err) {
    logger.error('opportunities.delete error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/opportunities/:id/apply  — creator applies
router.post(
  '/:id/apply',
  requireAuth,
  [param('id').isInt(), body('message').optional().trim().isLength({ max: 1000 })],
  validate,
  async (req, res) => {
    try {
      const opp = await db.query("SELECT id FROM opportunities WHERE id = $1 AND status = 'open'", [req.params.id]);
      if (!opp.rows.length) return res.status(404).json({ error: 'Opportunity not found or closed' });

      const result = await db.query(
        `INSERT INTO applications (opportunity_id, user_id, message) VALUES ($1, $2, $3)
         ON CONFLICT (opportunity_id, user_id) DO NOTHING RETURNING *`,
        [req.params.id, req.user.id, req.body.message || null],
      );
      if (!result.rows.length) return res.status(409).json({ error: 'Already applied' });

      await db.query('UPDATE opportunities SET applications_count = applications_count + 1 WHERE id = $1', [req.params.id]);
      auditLog({ actorId: req.user.id, actorType: 'user', action: 'opportunity.apply', targetType: 'opportunity', targetId: parseInt(req.params.id, 10), ip: req.ip });
      return res.status(201).json({ application: result.rows[0] });
    } catch (err) {
      logger.error('opportunities.apply error', { message: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
