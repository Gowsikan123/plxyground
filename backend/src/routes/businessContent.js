'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

// POST /api/business/content
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('body').optional().trim(),
    body('budget_range').optional().trim(),
    body('target_sport').optional().trim(),
  ],
  validationErrorHandler,
  (req, res) => {
    if (req.userType !== 'business')
      return res.status(403).json({ success: false, error: 'Business accounts only.' });
    try {
      const { title, body: bodyText, budget_range, target_sport } = req.body;
      const result = db
        .prepare(
          'INSERT INTO business_content (business_id, title, body, budget_range, target_sport, status) VALUES (?, ?, ?, ?, ?, \'pending\') RETURNING *'
        )
        .get(req.user.id, title, bodyText || null, budget_range || null, target_sport || null);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      logger.error('POST /api/business/content', { message: err.message });
      return res.status(500).json({ success: false, error: 'Failed to create content.' });
    }
  }
);

// GET /api/business/content/mine
router.get('/mine', requireAuth, (req, res) => {
  if (req.userType !== 'business')
    return res.status(403).json({ success: false, error: 'Business accounts only.' });
  try {
    const items = db
      .prepare(
        "SELECT * FROM business_content WHERE business_id = ? AND status != 'deleted' ORDER BY created_at DESC"
      )
      .all(req.user.id);
    return res.json({ success: true, data: { items } });
  } catch (err) {
    logger.error('GET /api/business/content/mine', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch content.' });
  }
});

// PUT /api/business/content/:id
router.put('/:id', requireAuth, (req, res) => {
  if (req.userType !== 'business')
    return res.status(403).json({ success: false, error: 'Business accounts only.' });
  try {
    const existing = db.prepare('SELECT * FROM business_content WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found.' });
    if (existing.business_id !== req.user.id)
      return res.status(403).json({ success: false, error: 'Not your content.' });

    const { title, body: bodyText, budget_range, target_sport, status } = req.body;
    db.prepare(
      `UPDATE business_content SET
        title        = COALESCE(?, title),
        body         = COALESCE(?, body),
        budget_range = COALESCE(?, budget_range),
        target_sport = COALESCE(?, target_sport),
        status       = COALESCE(?, status),
        updated_at   = datetime('now')
       WHERE id = ?`
    ).run(
      title || null,
      bodyText || null,
      budget_range || null,
      target_sport || null,
      status || null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM business_content WHERE id = ?').get(req.params.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    logger.error('PUT /api/business/content/:id', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to update content.' });
  }
});

module.exports = router;
