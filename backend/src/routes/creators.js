'use strict';
const { Router } = require('express');
const { query } = require('express-validator');
const db = require('../db/client');
const { validate } = require('../middleware/validate');
const logger = require('../logger');

const router = Router();

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sport').optional().trim(),
  query('q').optional().trim(),
], validate, (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const sport = req.query.sport;
    const q = req.query.q;

    let sql = 'SELECT * FROM creators WHERE 1=1';
    const params = [];
    if (sport) { sql += ' AND sport = ?'; params.push(sport); }
    if (q) { sql += ' AND (display_name LIKE ? OR username LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    sql += ' ORDER BY follower_count DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    const totalSql = 'SELECT COUNT(*) as n FROM creators WHERE 1=1' +
      (sport ? ' AND sport = ?' : '') + (q ? ' AND (display_name LIKE ? OR username LIKE ?)' : '');
    const totalParams = [...(sport ? [sport] : []), ...(q ? [`%${q}%`, `%${q}%`] : [])];
    const total = db.prepare(totalSql).get(...totalParams);

    res.json({ data: rows, meta: { page, limit, total: total.n } });
  } catch (err) {
    logger.error('Creators list error', { message: err.message });
    res.status(500).json({ error: 'Could not load creators.' });
  }
});

router.get('/:slug', (req, res) => {
  try {
    const creator = db.prepare('SELECT * FROM creators WHERE slug = ?').get(req.params.slug);
    if (!creator) return res.status(404).json({ error: 'Creator not found.' });
    const posts = db.prepare(`SELECT * FROM content WHERE creator_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 20`).all(creator.id);
    res.json({ data: { ...creator, posts } });
  } catch (err) {
    logger.error('Creator profile error', { message: err.message });
    res.status(500).json({ error: 'Could not load creator.' });
  }
});

module.exports = router;
