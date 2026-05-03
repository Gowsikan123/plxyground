'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

// POST /api/applications
router.post(
  '/',
  requireAuth,
  [
    body('opportunity_id').isInt().withMessage('Opportunity ID must be an integer.'),
    body('message').optional().trim().isLength({ max: 2000 }).withMessage('Message must be under 2000 chars.'),
  ],
  validationErrorHandler,
  (req, res) => {
    if (req.userType !== 'creator')
      return res.status(403).json({ success: false, error: 'Creators only.' });
    try {
      const { opportunity_id, message } = req.body;
      const opp = db
        .prepare("SELECT * FROM opportunities WHERE id = ? AND status = 'published'")
        .get(opportunity_id);
      if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found.' });

      const existing = db
        .prepare('SELECT 1 FROM applications WHERE opportunity_id = ? AND creator_id = ?')
        .get(opportunity_id, req.user.creator_id);
      if (existing) return res.status(409).json({ success: false, error: 'Already applied.' });

      const row = db
        .prepare('INSERT INTO applications (opportunity_id, creator_id, message) VALUES (?, ?, ?)')
        .run(opportunity_id, req.user.creator_id, message || null);

      const created = db.prepare('SELECT * FROM applications WHERE id = ?').get(row.lastInsertRowid);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      logger.error('POST /api/applications', { message: err.message });
      return res.status(500).json({ success: false, error: 'Failed to apply.' });
    }
  }
);

// GET /api/applications/mine
router.get('/mine', requireAuth, (req, res) => {
  if (req.userType !== 'creator')
    return res.status(403).json({ success: false, error: 'Creators only.' });
  try {
    const rows = db
      .prepare(
        `SELECT a.*, o.title AS opp_title, o.sport, o.budget
         FROM applications a
         JOIN opportunities o ON o.id = a.opportunity_id
         WHERE a.creator_id = ?
         ORDER BY a.created_at DESC`
      )
      .all(req.user.creator_id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('GET /api/applications/mine', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
  }
});

// GET /api/applications/opportunity/:id
router.get('/opportunity/:id', requireAuth, (req, res) => {
  try {
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp) return res.status(404).json({ success: false, error: 'Not found.' });
    const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    if (opp.posted_by_type !== req.userType || opp.posted_by_id !== posterId) {
      return res.status(403).json({ success: false, error: 'Not your opportunity.' });
    }
    const rows = db
      .prepare(
        `SELECT a.*, c.display_name, c.username, c.slug, c.avatar_url
         FROM applications a
         JOIN creators c ON c.id = a.creator_id
         WHERE a.opportunity_id = ?
         ORDER BY a.created_at DESC`
      )
      .all(req.params.id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('GET /api/applications/opportunity/:id', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
  }
});

// PUT /api/applications/:id/status
router.put(
  '/:id/status',
  requireAuth,
  [
    body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected.'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const appln = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
      if (!appln) return res.status(404).json({ success: false, error: 'Not found.' });

      const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(appln.opportunity_id);
      const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
      if (!opp || opp.posted_by_type !== req.userType || opp.posted_by_id !== posterId) {
        return res.status(403).json({ success: false, error: 'Not your opportunity.' });
      }

      db.prepare('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(req.body.status, req.params.id);

      const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('PUT /api/applications/:id/status', { message: err.message });
      return res.status(500).json({ success: false, error: 'Failed to update application.' });
    }
  }
);

module.exports = router;
