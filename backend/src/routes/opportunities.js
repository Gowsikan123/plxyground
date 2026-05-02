'use strict';

const express = require('express');
const { body, query: qv } = require('express-validator');
const router = express.Router();

const db = require('../db/client');
const auditLog = require('../utils/auditLogger');
const { requireAuth, requireBusiness } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const logger = require('../logger');

// GET /api/opportunities  — public list
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
        sportClause = `AND o.sport = $${params.length}`;
      }

      const { rows } = await db.query(
        `SELECT o.id, o.title, o.description, o.sport, o.budget_min, o.budget_max, o.currency,
                o.deadline, o.requirements, o.status, o.application_count, o.created_at,
                b.id AS business_id, b.company_name, b.logo_url, b.industry
         FROM opportunities o
         JOIN businesses b ON b.id = o.business_id
         WHERE o.status = 'open' ${sportClause}
         ORDER BY o.created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );

      res.json({ opportunities: rows, pagination: { page, limit } });
    } catch (err) {
      logger.error('opportunities.list error', { message: err.message });
      res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
  }
);

// GET /api/opportunities/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT o.*, b.company_name, b.logo_url, b.industry
       FROM opportunities o
       JOIN businesses b ON b.id = o.business_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    res.json({ opportunity: rows[0] });
  } catch (err) {
    logger.error('opportunities.get error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// POST /api/opportunities  — business creates opportunity
router.post(
  '/',
  requireAuth,
  requireBusiness,
  [
    body('title').trim().isLength({ min: 5, max: 200 }),
    body('description').optional().trim(),
    body('sport').optional().trim().isLength({ max: 50 }),
    body('budget_min').optional().isFloat({ min: 0 }),
    body('budget_max').optional().isFloat({ min: 0 }),
    body('deadline').optional().isDate(),
    body('requirements').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, sport, budget_min, budget_max, deadline, requirements } = req.body;

      const { rows } = await db.query(
        `INSERT INTO opportunities (business_id, title, description, sport, budget_min, budget_max, deadline, requirements, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')
         RETURNING *`,
        [req.business.id, title, description || null, sport || null, budget_min || null, budget_max || null, deadline || null, requirements || null]
      );

      auditLog({ actorId: req.business.id, actorType: 'business', action: 'opportunity.create', targetType: 'opportunity', targetId: rows[0].id, ip: req.ip });
      res.status(201).json({ opportunity: rows[0] });
    } catch (err) {
      logger.error('opportunities.create error', { message: err.message });
      res.status(500).json({ error: 'Failed to create opportunity' });
    }
  }
);

// PATCH /api/opportunities/:id
router.patch(
  '/:id',
  requireAuth,
  requireBusiness,
  [
    body('title').optional().trim().isLength({ max: 200 }),
    body('status').optional().isIn(['open', 'closed', 'draft']),
  ],
  validate,
  async (req, res) => {
    try {
      const { rows: existing } = await db.query(
        'SELECT id, business_id FROM opportunities WHERE id = $1',
        [req.params.id]
      );
      if (!existing.length) return res.status(404).json({ error: 'Opportunity not found' });
      if (existing[0].business_id !== req.business.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { title, description, sport, budget_min, budget_max, deadline, requirements, status } = req.body;
      const { rows } = await db.query(
        `UPDATE opportunities
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             sport = COALESCE($3, sport),
             budget_min = COALESCE($4, budget_min),
             budget_max = COALESCE($5, budget_max),
             deadline = COALESCE($6, deadline),
             requirements = COALESCE($7, requirements),
             status = COALESCE($8, status),
             updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [title, description, sport, budget_min, budget_max, deadline, requirements, status, req.params.id]
      );

      auditLog({ actorId: req.business.id, actorType: 'business', action: 'opportunity.update', targetType: 'opportunity', targetId: req.params.id, ip: req.ip });
      res.json({ opportunity: rows[0] });
    } catch (err) {
      logger.error('opportunities.update error', { message: err.message });
      res.status(500).json({ error: 'Failed to update opportunity' });
    }
  }
);

// DELETE /api/opportunities/:id
router.delete('/:id', requireAuth, requireBusiness, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, business_id FROM opportunities WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    if (rows[0].business_id !== req.business.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
    auditLog({ actorId: req.business.id, actorType: 'business', action: 'opportunity.delete', targetType: 'opportunity', targetId: req.params.id, ip: req.ip });
    res.status(204).end();
  } catch (err) {
    logger.error('opportunities.delete error', { message: err.message });
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

// POST /api/opportunities/:id/apply  — creator applies
router.post('/:id/apply', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(403).json({ error: 'Creator account required' });

    const { rows: opp } = await db.query(
      'SELECT id, status FROM opportunities WHERE id = $1',
      [req.params.id]
    );
    if (!opp.length) return res.status(404).json({ error: 'Opportunity not found' });
    if (opp[0].status !== 'open') return res.status(400).json({ error: 'Opportunity is not open' });

    const { rows } = await db.query(
      `INSERT INTO applications (opportunity_id, user_id, message)
       VALUES ($1, $2, $3)
       ON CONFLICT (opportunity_id, user_id) DO NOTHING
       RETURNING *`,
      [req.params.id, req.user.id, req.body.message || null]
    );

    if (!rows.length) return res.status(409).json({ error: 'Already applied' });

    await db.query(
      'UPDATE opportunities SET application_count = application_count + 1 WHERE id = $1',
      [req.params.id]
    );

    auditLog({ actorId: req.user.id, actorType: 'creator', action: 'opportunity.apply', targetType: 'opportunity', targetId: req.params.id, ip: req.ip });
    res.status(201).json({ application: rows[0] });
  } catch (err) {
    logger.error('opportunities.apply error', { message: err.message });
    res.status(500).json({ error: 'Failed to apply' });
  }
});

module.exports = router;
