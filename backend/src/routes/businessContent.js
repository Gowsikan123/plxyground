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
], validate, (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Forbidden' });
    const { title, body: bodyText, media_url, budget_range, target_sport } = req.body;
    const result = db.prepare(
      `INSERT INTO business_content (business_id, title, body, media_url, budget_range, target_sport) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.user.sub, title, bodyText || null, media_url || null, budget_range || null, target_sport || null);
    db.prepare(`INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', ?)`).run(result.lastInsertRowid);
    const created = db.prepare('SELECT * FROM business_content WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/business/content/mine
router.get('/mine', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Forbidden' });
    const rows = db.prepare('SELECT * FROM business_content WHERE business_id = ? ORDER BY created_at DESC').all(req.user.sub);
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/business/content/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    if (req.userType !== 'business') return res.status(403).json({ success: false, error: 'Forbidden' });
    const row = db.prepare('SELECT * FROM business_content WHERE id = ? AND business_id = ?').get(req.params.id, req.user.sub);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    const { title, body: bodyText, budget_range, target_sport } = req.body;
    db.prepare(
      `UPDATE business_content SET title = ?, body = ?, budget_range = ?, target_sport = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(title ?? row.title, bodyText ?? row.body, budget_range ?? row.budget_range, target_sport ?? row.target_sport, row.id);
    const updated = db.prepare('SELECT * FROM business_content WHERE id = ?').get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
