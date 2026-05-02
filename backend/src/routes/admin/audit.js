'use strict';
const express = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/audit
router.get('/', requireAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const actor_type = req.query.actor_type || '';
    const action = req.query.action || '';
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    if (actor_type) { sql += ' AND actor_type = ?'; params.push(actor_type); }
    if (action) { sql += ' AND action LIKE ?'; params.push(`%${action}%`); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = db.prepare(sql).all(...params);
    const total = db.prepare('SELECT COUNT(*) as c FROM audit_log').get().c;
    return res.json({ success: true, data: { items: rows, total } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/audit/export
router.get('/export', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC').all();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_log.json');
    return res.send(JSON.stringify(rows, null, 2));
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
