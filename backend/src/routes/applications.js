'use strict';
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

router.post('/', requireAuth, [
  body('opportunity_id').isInt().withMessage('Opportunity ID must be an integer.'),
  body('message').optional().trim().isLength({ max: 2000 }).withMessage('Message must be under 2000 chars.'),
], validate, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creators only.' });
  try {
    const { opportunity_id, message } = req.body;
    const oppRes = await pool.query("SELECT * FROM opportunities WHERE id = $1 AND status = 'published'", [opportunity_id]);
    if (!oppRes.rows[0]) return res.status(404).json({ error: 'Opportunity not found.' });
    const existing = await pool.query(
      'SELECT 1 FROM applications WHERE opportunity_id = $1 AND creator_id = $2',
      [opportunity_id, req.user.creator_id]
    );
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Already applied.' });
    const { rows } = await pool.query(
      'INSERT INTO applications (opportunity_id, creator_id, message) VALUES ($1,$2,$3) RETURNING *',
      [opportunity_id, req.user.creator_id, message || null]
    );
    return res.status(201).json({ application: rows[0] });
  } catch (err) {
    logger.error('POST /api/applications', { message: err.message });
    return res.status(500).json({ error: 'Failed to apply.' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  if (req.userType !== 'creator') return res.status(403).json({ error: 'Creators only.' });
  try {
    const { rows } = await pool.query(
      `SELECT a.*, o.title AS opp_title, o.sport, o.budget FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.creator_id = $1 ORDER BY a.created_at DESC`,
      [req.user.creator_id]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/applications/mine', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

router.get('/opportunity/:id', requireAuth, async (req, res) => {
  try {
    const { rows: opp } = await pool.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
    if (!opp[0]) return res.status(404).json({ error: 'Not found.' });
    const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    if (opp[0].posted_by_type !== req.userType || opp[0].posted_by_id !== posterId) {
      return res.status(403).json({ error: 'Not your opportunity.' });
    }
    const { rows } = await pool.query(
      `SELECT a.*, c.display_name, c.username, c.slug, c.avatar_url FROM applications a
       JOIN creators c ON c.id = a.creator_id WHERE a.opportunity_id = $1 ORDER BY a.created_at DESC`,
      [req.params.id]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/applications/opportunity/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

router.put('/:id/status', requireAuth, [
  body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected.'),
], validate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found.' });
    const appln = rows[0];
    const { rows: opp } = await pool.query('SELECT * FROM opportunities WHERE id = $1', [appln.opportunity_id]);
    const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    if (!opp[0] || opp[0].posted_by_type !== req.userType || opp[0].posted_by_id !== posterId) {
      return res.status(403).json({ error: 'Not your opportunity.' });
    }
    const { rows: updated } = await pool.query(
      'UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [req.body.status, req.params.id]
    );
    return res.json({ application: updated[0] });
  } catch (err) {
    logger.error('PUT /api/applications/:id/status', { message: err.message });
    return res.status(500).json({ error: 'Failed to update application.' });
  }
});

module.exports = router;
