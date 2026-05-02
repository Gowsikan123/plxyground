'use strict';
const { Router } = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const actor_type = req.query.actor_type || '';
    const action = req.query.action || '';
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    const params = [];
    let where = 'WHERE 1=1';
    if (actor_type) { where += ' AND actor_type = ?'; params.push(actor_type); }
    if (action) { where += ' AND action LIKE ?'; params.push(`%${action}%`); }

    const logs = db.prepare(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);
    const total = db.prepare(`SELECT COUNT(*) as count FROM audit_log ${where}`).get(...params).count;
    return res.json({ success: true, data: { logs, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/export', requireAdmin, (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC').all();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-export.json"');
    return res.send(JSON.stringify(logs, null, 2));
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
