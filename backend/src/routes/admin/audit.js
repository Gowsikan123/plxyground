'use strict';
const { Router } = require('express');
const { query } = require('express-validator');
const db = require('../../db/client');
const { requireAuth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const logger = require('../../logger');

const router = Router();
const adminOnly = requireAuth('admin');

router.get('/', adminOnly, [
  query('page').optional().isInt({ min: 1 }),
  query('actor_type').optional().isIn(['admin', 'creator', 'business', 'system']),
], validate, (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    const actorType = req.query.actor_type;

    let sql = 'SELECT * FROM audit_log';
    const params = [];
    if (actorType) { sql += ' WHERE actor_type = ?'; params.push(actorType); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    const totalSql = 'SELECT COUNT(*) as n FROM audit_log' + (actorType ? ' WHERE actor_type = ?' : '');
    const total = db.prepare(totalSql).get(...(actorType ? [actorType] : []));

    res.json({ data: rows, meta: { page, limit, total: total.n } });
  } catch (err) {
    logger.error('Audit log error', { message: err.message });
    res.status(500).json({ error: 'Could not load audit log.' });
  }
});

module.exports = router;
