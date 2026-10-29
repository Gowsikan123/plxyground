'use strict';
const express = require('express');
const { body } = require('express-validator');
const sql = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

function ownsOpportunity(req, opp) {
  const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
  return opp && opp.posted_by_type === req.userType && opp.posted_by_id === posterId;
}

// POST /api/applications
router.post(
  '/',
  requireAuth,
  [
    body('opportunity_id').isInt().withMessage('Opportunity ID must be an integer.'),
    body('message').optional().trim().isLength({ max: 2000 }).withMessage('Message must be under 2000 chars.'),
  ],
  validationErrorHandler,
  async (req, res) => {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creators only.' });
    try {
      const opportunityId = parseInt(req.body.opportunity_id, 10);
      const [opp] = await sql`SELECT id FROM opportunities WHERE id = ${opportunityId} AND status = 'published'`;
      if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found.' });

      // UNIQUE(opportunity_id, creator_id) makes a second application a no-op.
      const [created] = await sql`
        INSERT INTO applications (opportunity_id, creator_id, message)
        VALUES (${opportunityId}, ${req.user.creator_id}, ${req.body.message || null})
        ON CONFLICT (opportunity_id, creator_id) DO NOTHING
        RETURNING *`;
      if (!created) return res.status(409).json({ success: false, error: 'Already applied.' });
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      logger.error(`POST /api/applications: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Failed to apply.' });
    }
  }
);

// GET /api/applications/mine
router.get('/mine', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creators only.' });
  try {
    const rows = await sql`
      SELECT a.*, o.title AS opp_title, o.sport, o.budget
      FROM applications a
      JOIN opportunities o ON o.id = a.opportunity_id
      WHERE a.creator_id = ${req.user.creator_id}
      ORDER BY a.created_at DESC`;
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error(`GET /api/applications/mine: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
  }
});

// GET /api/applications/opportunity/:id
router.get('/opportunity/:id', requireAuth, async (req, res) => {
  try {
    const [opp] = await sql`SELECT * FROM opportunities WHERE id = ${parseInt(req.params.id, 10)}`;
    if (!opp) return res.status(404).json({ success: false, error: 'Not found.' });
    if (!ownsOpportunity(req, opp)) return res.status(403).json({ success: false, error: 'Not your opportunity.' });

    const rows = await sql`
      SELECT a.*, c.display_name, c.username, c.slug, c.avatar_url
      FROM applications a
      JOIN creators c ON c.id = a.creator_id
      WHERE a.opportunity_id = ${opp.id}
      ORDER BY a.created_at DESC`;
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error(`GET /api/applications/opportunity/:id: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
  }
});

// PUT /api/applications/:id/status
router.put(
  '/:id/status',
  requireAuth,
  [body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected.')],
  validationErrorHandler,
  async (req, res) => {
    try {
      const [appln] = await sql`SELECT * FROM applications WHERE id = ${parseInt(req.params.id, 10)}`;
      if (!appln) return res.status(404).json({ success: false, error: 'Not found.' });

      const [opp] = await sql`SELECT * FROM opportunities WHERE id = ${appln.opportunity_id}`;
      if (!ownsOpportunity(req, opp)) return res.status(403).json({ success: false, error: 'Not your opportunity.' });

      const [updated] = await sql`
        UPDATE applications SET status = ${req.body.status}, updated_at = NOW()
        WHERE id = ${appln.id}
        RETURNING *`;
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error(`PUT /api/applications/:id/status: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Failed to update application.' });
    }
  }
);

module.exports = router;
