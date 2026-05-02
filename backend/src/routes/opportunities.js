'use strict';

const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const audit = require('../utils/auditLogger');
const logger = require('../logger');

const opportunityValidation = [
  body('title').trim().isLength({ min: 2, max: 160 }),
  body('description').trim().isLength({ min: 10, max: 3000 }),
  body('opportunity_type').isIn(['sponsorship', 'collab', 'event', 'ambassador', 'other']),
  body('sport').optional().trim().isLength({ max: 80 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('deadline').optional().isISO8601(),
  body('budget').optional({ nullable: true }).isNumeric(),
];

// GET /api/opportunities — public list
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const type = req.query.type || null;
    const sport = req.query.sport || null;

    const conditions = [`o.status = 'active'`];
    const params = [];

    if (type) { params.push(type); conditions.push(`o.opportunity_type = $${params.length}`); }
    if (sport) { params.push(sport); conditions.push(`o.sport = $${params.length}`); }

    const where = conditions.join(' AND ');
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT o.id, o.title, o.description, o.opportunity_type, o.sport,
              o.location, o.deadline, o.budget, o.created_at,
              b.business_name, b.industry
       FROM opportunities o
       JOIN businesses b ON b.id = o.business_id
       WHERE ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ opportunities: rows, limit, offset });
  } catch (err) {
    logger.error('Opportunities list error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/opportunities/:id — single opportunity
router.get('/:id', param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });
  try {
    const { rows } = await db.query(
      `SELECT o.*, b.business_name, b.industry, b.website
       FROM opportunities o
       JOIN businesses b ON b.id = o.business_id
       WHERE o.id = $1 AND o.status = 'active'`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    return res.json({ opportunity: rows[0] });
  } catch (err) {
    logger.error('Opportunity get error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/opportunities — business creates opportunity
router.post('/', requireAuth('business'), opportunityValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });

  const { title, description, opportunity_type, sport, location, deadline, budget } = req.body;

  try {
    const { rows } = await db.query(
      `INSERT INTO opportunities
         (business_id, title, description, opportunity_type, sport, location, deadline, budget, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active')
       RETURNING *`,
      [req.user.sub, title, description, opportunity_type, sport || null, location || null, deadline || null, budget || null]
    );

    audit(req.user.sub, 'business', 'opportunity.create', { id: rows[0].id, title });
    logger.info('Opportunity created', { business_id: req.user.sub, opp_id: rows[0].id });
    return res.status(201).json({ opportunity: rows[0] });
  } catch (err) {
    logger.error('Opportunity create error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/opportunities/:id — business updates own opportunity
router.patch('/:id', requireAuth('business'), param('id').isInt(), opportunityValidation, async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Validation failed' });

  const { title, description, opportunity_type, sport, location, deadline, budget } = req.body;

  try {
    const check = await db.query('SELECT business_id FROM opportunities WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    if (check.rows[0].business_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });

    const { rows } = await db.query(
      `UPDATE opportunities
       SET title=$1, description=$2, opportunity_type=$3, sport=$4,
           location=$5, deadline=$6, budget=$7, updated_at=NOW()
       WHERE id=$8
       RETURNING *`,
      [title, description, opportunity_type, sport || null, location || null, deadline || null, budget || null, req.params.id]
    );

    audit(req.user.sub, 'business', 'opportunity.update', { id: rows[0].id });
    return res.json({ opportunity: rows[0] });
  } catch (err) {
    logger.error('Opportunity update error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/opportunities/:id — business deletes own opportunity
router.delete('/:id', requireAuth('business'), param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });

  try {
    const check = await db.query('SELECT business_id FROM opportunities WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    if (check.rows[0].business_id !== req.user.sub) return res.status(403).json({ error: 'Forbidden' });

    await db.query('UPDATE opportunities SET status=$1, updated_at=NOW() WHERE id=$2', ['closed', req.params.id]);
    audit(req.user.sub, 'business', 'opportunity.close', { id: req.params.id });
    return res.status(204).send();
  } catch (err) {
    logger.error('Opportunity delete error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
