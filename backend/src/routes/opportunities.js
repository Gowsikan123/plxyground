'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/opportunities
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    let sql = `SELECT * FROM opportunities WHERE status = 'published'`;
    const params = [];
    if (search) { sql += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (sport) { sql += ' AND sport = ?'; params.push(sport); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = db.prepare(sql).all(...params);
    const total = db.prepare(`SELECT COUNT(*) as c FROM opportunities WHERE status = 'published'`).get().c;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/opportunities/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT * FROM opportunities WHERE id = ? AND status = 'published'`).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: row });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/opportunities
router.post('/', requireAuth, [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1 }),
], validate, (req, res) => {
  try {
    const { title, description, sport, location, budget, deadline } = req.body;
    const posted_by_type = req.userType === 'business' ? 'business' : 'creator';
    const result = db.prepare(
      `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(posted_by_type, req.user.sub, title, description, sport || null, location || null, budget || null, deadline || null);
    const created = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/opportunities/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const posted_by_type = req.userType === 'business' ? 'business' : 'creator';
    const row = db.prepare('SELECT * FROM opportunities WHERE id = ? AND posted_by_id = ? AND posted_by_type = ?').get(req.params.id, req.user.sub, posted_by_type);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    const { title, description, sport, location, budget, deadline } = req.body;
    db.prepare(
      `UPDATE opportunities SET title = ?, description = ?, sport = ?, location = ?, budget = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(title ?? row.title, description ?? row.description, sport ?? row.sport, location ?? row.location, budget ?? row.budget, deadline ?? row.deadline, row.id);
    const updated = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/opportunities/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const posted_by_type = req.userType === 'business' ? 'business' : 'creator';
    const row = db.prepare('SELECT * FROM opportunities WHERE id = ? AND posted_by_id = ? AND posted_by_type = ?').get(req.params.id, req.user.sub, posted_by_type);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    db.prepare(`UPDATE opportunities SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(row.id);
    return res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
