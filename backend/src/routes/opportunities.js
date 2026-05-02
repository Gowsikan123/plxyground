'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');

const router = Router();

function attachPoster(opp) {
  if (opp.posted_by_type === 'creator') {
    const c = db.prepare('SELECT display_name, avatar_url, username, slug FROM creators WHERE id = ?').get(opp.posted_by_id);
    return { ...opp, poster: c || null };
  }
  const b = db.prepare('SELECT company_name as display_name, logo_url as avatar_url, slug FROM businesses WHERE id = ?').get(opp.posted_by_id);
  return { ...opp, poster: b || null };
}

router.get('/', (req, res) => {
  try {
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const params = [];
    let where = "WHERE o.status = 'published'";
    if (search) {
      where += ' AND (o.title LIKE ? OR o.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (sport) {
      where += ' AND o.sport = ?';
      params.push(sport);
    }

    const opps = db.prepare(
      `SELECT * FROM opportunities o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) as count FROM opportunities o ${where}`).get(...params).count;

    const data = opps.map(attachPoster);
    return res.json({ success: true, data: { opportunities: data, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ? AND status != ?').get(req.params.id, 'deleted');
    if (!opp) return res.status(404).json({ success: false, error: 'Not found.' });
    return res.json({ success: true, data: attachPoster(opp) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const { title, description, sport = '', location = '', budget = '', deadline = '' } = req.body;
      const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
      const result = db.prepare(
        'INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(req.userType, posterId, title, description, sport, location, budget, deadline);
      const row = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json({ success: true, data: attachPoster(row) });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.put('/:id', requireAuth, (req, res) => {
  try {
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp) return res.status(404).json({ success: false, error: 'Not found.' });
    const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    if (opp.posted_by_type !== req.userType || opp.posted_by_id !== posterId) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }
    const { title = opp.title, description = opp.description, sport = opp.sport, location = opp.location, budget = opp.budget, deadline = opp.deadline, status = opp.status } = req.body;
    db.prepare('UPDATE opportunities SET title=?,description=?,sport=?,location=?,budget=?,deadline=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(title, description, sport, location, budget, deadline, status, opp.id);
    const updated = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(opp.id);
    return res.json({ success: true, data: attachPoster(updated) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  try {
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp) return res.status(404).json({ success: false, error: 'Not found.' });
    const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    if (opp.posted_by_type !== req.userType || opp.posted_by_id !== posterId) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }
    db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run('deleted', opp.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
