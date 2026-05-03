'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const audit = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');

const router = express.Router();

function attachPoster(opp) {
  if (opp.posted_by_type === 'creator') {
    const c = db.prepare('SELECT display_name, username, avatar_url FROM creators WHERE id = ?').get(opp.posted_by_id);
    return { ...opp, poster: c || null };
  }
  const b = db.prepare('SELECT company_name, logo_url FROM businesses WHERE id = ?').get(opp.posted_by_id);
  return { ...opp, poster: b ? { display_name: b.company_name, avatar_url: b.logo_url } : null };
}

router.get('/', (req, res) => {
  try {
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    let where = "WHERE o.status = 'published'";
    const params = [];
    if (search) {
      where += ' AND (o.title LIKE ? OR o.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (sport) {
      where += ' AND o.sport = ?';
      params.push(sport);
    }

    const rows = db.prepare(`SELECT * FROM opportunities o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) as n FROM opportunities o ${where}`).get(...params).n;
    const opps = rows.map(attachPoster);

    return res.json({ success: true, data: { opportunities: opps, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/mine/list', requireAuth, (req, res) => {
  try {
    const postedById = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    const rows = db
      .prepare(
        'SELECT * FROM opportunities WHERE posted_by_type = ? AND posted_by_id = ? AND status != ? ORDER BY created_at DESC'
      )
      .all(req.userType, postedById, 'deleted')
      .map(attachPoster);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp || opp.status === 'deleted') return res.status(404).json({ success: false, error: 'Opportunity not found' });
    return res.json({ success: true, data: attachPoster(opp) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title required'),
    body('description').notEmpty().withMessage('Description required'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const { title, description, sport = '', location = '', budget = '', deadline = '' } = req.body;
      const posted_by_id = req.userType === 'creator' ? req.user.creator_id : req.user.id;

      const row = db
        .prepare('INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(req.userType, posted_by_id, title, description, sport, location, budget, deadline);

      audit.log({ actor_type: req.userType, actor_id: req.user.id, action: 'OPPORTUNITY_CREATED', target_type: 'opportunities', target_id: row.lastInsertRowid, ip_address: req.ip });
      const created = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(row.lastInsertRowid);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.put('/:id', requireAuth, (req, res) => {
  try {
    const posted_by_id = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ? AND posted_by_type = ? AND posted_by_id = ?').get(req.params.id, req.userType, posted_by_id);
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found or not yours' });

    const { title, description, sport, location, budget, deadline, status } = req.body;
    db.prepare('UPDATE opportunities SET title=?, description=?, sport=?, location=?, budget=?, deadline=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(
        title !== undefined ? title : opp.title,
        description !== undefined ? description : opp.description,
        sport !== undefined ? sport : opp.sport,
        location !== undefined ? location : opp.location,
        budget !== undefined ? budget : opp.budget,
        deadline !== undefined ? deadline : opp.deadline,
        status !== undefined ? status : opp.status,
        opp.id
      );
    const updated = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(opp.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  try {
    const posted_by_id = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ? AND posted_by_type = ? AND posted_by_id = ?').get(req.params.id, req.userType, posted_by_id);
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found or not yours' });
    db.prepare("UPDATE opportunities SET status='deleted', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(opp.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
