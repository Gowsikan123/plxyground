'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/business/content
router.post('/', requireAuth, [
  body('title').trim().isLength({ min: 1, max: 200 }),
], validate, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Forbidden' });
    const { title, body: bodyText, media_url, budget_range, target_sport } = req.body;
    const result = await db.prepare(
      `INSERT INTO business_content (business_id, title, body, media_url, budget_range, target_sport) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
    ).run(req.user.sub, title, bodyText || null, media_url || null, budget_range || null, target_sport || null);
    await db.prepare(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)`).run(result.lastInsertRowid);
    const created = await db.prepare('SELECT * FROM business_content WHERE id = $1').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/business/content/mine
router.get('/mine', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Forbidden' });
    const rows = await db.prepare('SELECT * FROM business_content WHERE business_id = $1 ORDER BY created_at DESC').all(req.user.sub);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/business/content/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Forbidden' });
    const row = await db.prepare('SELECT * FROM business_content WHERE id = $1 AND business_id = $2').get(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    await db.prepare(
      `UPDATE business_content SET title = $1, body = $2, budget_range = $3, target_sport = $4, status = 'pending', updated_at = NOW() WHERE id = $5`
    ).run(title ?? row.title, bodyText ?? row.body, budget_range ?? row.budget_range, target_sport ?? row.target_sport, row.id);
    const updated = await db.prepare('SELECT * FROM business_content WHERE id = $1').get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
