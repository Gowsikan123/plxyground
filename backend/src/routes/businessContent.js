'use strict';
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/client');   // PostgreSQL — same as content.js & admin.js
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
  async (req, res) => {
    if (req.userType !== 'business')
      return res.status(403).json({ success: false, error: 'Business accounts only.' });
    try {
      const { title, body: bodyText, budget_range, target_sport } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO business_content (business_id, title, body, budget_range, target_sport, status)
         VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
        [req.user.id, title, bodyText || null, budget_range || null, target_sport || null]
      );
      const created = rows[0];
      // Insert into moderation queue — content_type matches admin.js /queue JOIN
      await pool.query(
        "INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)",
        [created.id]
      );
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      logger.error('POST /api/business/content', { message: err.message });
      return res.status(500).json({ success: false, error: 'Failed to create content.' });
    }
  }
);

// GET /api/business/content/mine
router.get('/mine', requireAuth, async (req, res) => {
  if (req.userType !== 'business')
    return res.status(403).json({ success: false, error: 'Business accounts only.' });
  try {
    const { rows } = await pool.query(
      "SELECT * FROM business_content WHERE business_id = $1 AND status != 'deleted' ORDER BY created_at DESC",
      [req.user.id]
    );
    return res.json({ success: true, data: { items: rows } });
  } catch (err) {
    logger.error('GET /api/business/content/mine', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch content.' });
  }
});

// PUT /api/business/content/:id
router.put('/:id', requireAuth, async (req, res) => {
  if (req.userType !== 'business')
    return res.status(403).json({ success: false, error: 'Business accounts only.' });
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM business_content WHERE id = $1',
      [req.params.id]
    );
    if (!existing[0]) return res.status(404).json({ success: false, error: 'Not found.' });
    if (existing[0].business_id !== req.user.id)
      return res.status(403).json({ success: false, error: 'Not your content.' });

    const post = existing[0];
    const { title, body: bodyText, budget_range, target_sport } = req.body;

    // Re-queue for moderation if editing published content
    if ((title !== undefined || bodyText !== undefined) && post.status === 'published') {
      await pool.query(
        "INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)",
        [post.id]
      );
    }

    const { rows: updated } = await pool.query(
      `UPDATE business_content SET
        title        = COALESCE($1, title),
        body         = COALESCE($2, body),
        budget_range = COALESCE($3, budget_range),
        target_sport = COALESCE($4, target_sport),
        status       = CASE WHEN ($1 IS NOT NULL OR $2 IS NOT NULL) AND status = 'published'
                            THEN 'pending' ELSE status END,
        updated_at   = NOW()
       WHERE id = $5 RETURNING *`,
      [title || null, bodyText || null, budget_range || null, target_sport || null, req.params.id]
    );
    return res.json({ success: true, data: updated[0] });
  } catch (err) {
    logger.error('PUT /api/business/content/:id', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to update content.' });
  }
});

module.exports = router;
