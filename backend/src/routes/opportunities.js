'use strict';
const { Router } = require('express');
const { body, query } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { logAudit } = require('../utils/auditLogger');
const logger = require('../logger');

const router = Router();

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sport').optional().trim(),
], validate, (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const sport = req.query.sport;

    let sql = `SELECT * FROM opportunities WHERE status = 'published'`;
    const params = [];
    if (sport) { sql += ' AND sport = ?'; params.push(sport); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    const total = db.prepare(`SELECT COUNT(*) as n FROM opportunities WHERE status = 'published'${sport ? ' AND sport = ?' : ''}`).get(...(sport ? [sport] : []));

    res.json({ data: rows, meta: { page, limit, total: total.n } });
  } catch (err) {
    logger.error('Opportunities list error', { message: err.message });
    res.status(500).json({ error: 'Could not load opportunities.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const opp = db.prepare(`SELECT * FROM opportunities WHERE id = ? AND status = 'published'`).get(req.params.id);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found.' });
    res.json({ data: opp });
  } catch (err) {
    logger.error('Opportunity fetch error', { message: err.message });
    res.status(500).json({ error: 'Could not load opportunity.' });
  }
});

router.post('/', requireAuth(), [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 1 }),
  body('sport').optional().trim(),
  body('location').optional().trim(),
  body('budget').optional().trim(),
  body('deadline').optional().trim(),
], validate, (req, res) => {
  try {
    const { title, description, sport = '', location = '', budget = '', deadline = '' } = req.body;
    const postedByType = req.user.role;
    const result = db.prepare(
      'INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(postedByType, req.user.id, title, description, sport, location, budget, deadline);

    logAudit({ actorType: postedByType, actorId: req.user.id, action: 'opportunity_created', targetType: 'opportunity', targetId: result.lastInsertRowid, ipAddress: req.ip });

    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: opp });
  } catch (err) {
    logger.error('Opportunity create error', { message: err.message });
    res.status(500).json({ error: 'Could not create opportunity.' });
  }
});

router.delete('/:id', requireAuth(), (req, res) => {
  try {
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ? AND posted_by_id = ? AND posted_by_type = ?').get(req.params.id, req.user.id, req.user.role);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found or not yours.' });
    db.prepare(`UPDATE opportunities SET status = 'deleted' WHERE id = ?`).run(opp.id);
    logAudit({ actorType: req.user.role, actorId: req.user.id, action: 'opportunity_deleted', targetType: 'opportunity', targetId: opp.id, ipAddress: req.ip });
    res.json({ message: 'Opportunity deleted.' });
  } catch (err) {
    logger.error('Opportunity delete error', { message: err.message });
    res.status(500).json({ error: 'Could not delete opportunity.' });
  }
});

module.exports = router;
