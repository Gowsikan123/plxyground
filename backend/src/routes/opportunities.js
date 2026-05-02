'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/opportunities
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    let sql = `SELECT * FROM opportunities WHERE status = 'published'`;
    const params = [];
    let idx = 1;
    if (search) { sql += ` AND (title ILIKE $${idx} OR description ILIKE $${idx+1})`; params.push(`%${search}%`, `%${search}%`); idx += 2; }
    if (sport) { sql += ` AND sport = $${idx}`; params.push(sport); idx++; }
    sql += ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(limit, offset);
    const rows = await db.prepare(sql).all(...params);
    const total = (await db.prepare(`SELECT COUNT(*) as c FROM opportunities WHERE status = 'published'`).get()).c;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/opportunities/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await db.prepare(`SELECT * FROM opportunities WHERE id = $1 AND status = 'published'`).get(req.params.id);
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
], validate, async (req, res) => {
  try {
    const { title, description, sport, location, budget, deadline } = req.body;
    const posted_by_type = req.userType === 'business' ? 'business' : 'creator';
    const result = await db.prepare(
      `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
    ).run(posted_by_type, req.user.sub, title, description, sport || null, location || null, budget || null, deadline || null);
    const created = await db.prepare('SELECT * FROM opportunities WHERE id = $1').get(result.lastInsertRowid);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/opportunities/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const posted_by_type = req.userType === 'business' ? 'business' : 'creator';
    const row = await db.prepare('SELECT * FROM opportunities WHERE id = $1 AND posted_by_id = $2 AND posted_by_type = $3').get(req.params.id, req.user.sub, posted_by_type);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    const { title, description, sport, location, budget, deadline } = req.body;
    await db.prepare(
      `UPDATE opportunities SET title = $1, description = $2, sport = $3, location = $4, budget = $5, deadline = $6, updated_at = NOW() WHERE id = $7`
    ).run(title ?? row.title, description ?? row.description, sport ?? row.sport, location ?? row.location, budget ?? row.budget, deadline ?? row.deadline, row.id);
    const updated = await db.prepare('SELECT * FROM opportunities WHERE id = $1').get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/opportunities/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const posted_by_type = req.userType === 'business' ? 'business' : 'creator';
    const row = await db.prepare('SELECT * FROM opportunities WHERE id = $1 AND posted_by_id = $2 AND posted_by_type = $3').get(req.params.id, req.user.sub, posted_by_type);
    if (!row) return res.status(404).json({ success: false, error: 'Not found or not yours' });
    await db.prepare(`UPDATE opportunities SET status = 'deleted', updated_at = NOW() WHERE id = $1`).run(row.id);
    return res.json({ success: true, data: { message: 'Deleted' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
