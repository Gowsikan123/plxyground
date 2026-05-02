'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

router.post('/', requireAuth, [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('body').optional().trim(),
  body('budget_range').optional().trim(),
  body('target_sport').optional().trim(),
], validate, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business accounts only.' });
  try {
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    const { rows } = await db.query(
      'INSERT INTO business_content (business_id, title, body, budget_range, target_sport) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, title, bodyText || null, budget_range || null, target_sport || null]
    );
    return res.status(201).json({ content: rows[0] });
  } catch (err) {
    logger.error('POST /api/business-content', { message: err.message });
    return res.status(500).json({ error: 'Failed to create content.' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business accounts only.' });
  try {
    const { rows } = await db.query(
      "SELECT * FROM business_content WHERE business_id = $1 AND status != 'deleted' ORDER BY created_at DESC",
      [req.user.id]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/business-content/mine', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch content.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'business') return res.status(403).json({ error: 'Business accounts only.' });
  try {
    const { rows: existing } = await db.query('SELECT * FROM business_content WHERE id = $1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Not found.' });
    if (existing[0].business_id !== req.user.id) return res.status(403).json({ error: 'Not your content.' });
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    const { rows } = await db.query(
      'UPDATE business_content SET title = COALESCE($1, title), body = COALESCE($2, body), budget_range = COALESCE($3, budget_range), target_sport = COALESCE($4, target_sport), updated_at = NOW() WHERE id = $5 RETURNING *',
      [title || null, bodyText || null, budget_range || null, target_sport || null, req.params.id]
    );
    return res.json({ content: rows[0] });
  } catch (err) {
    logger.error('PUT /api/business-content/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update content.' });
  }
});

module.exports = router;
