'use strict';
const express = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/audit?actor_type=&action=&limit=&offset=
// Frontend reads: r.data.data (array), l.id, l.actor_id, l.actor_type, l.action,
//                l.target_type, l.target_id, l.ip_address, l.meta, l.created_at
router.get('/', requireAdmin, (req, res) => {
  try {
    const actor_type = req.query.actor_type || '';
    const action     = req.query.action     || '';
    const limit      = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset     = parseInt(req.query.offset) || 0;

    let where  = 'WHERE 1=1';
    const params = [];
    if (actor_type) { where += ' AND actor_type = ?'; params.push(actor_type); }
    if (action)     { where += ' AND action LIKE ?';  params.push(`%${action}%`); }

    const rows = db.prepare(
      // alias metadata -> meta so the frontend JSON.stringify(l.meta) works
      `SELECT
         id, actor_type, actor_id, action,
         target_type, target_id,
         ip_address,
         metadata AS meta,
         created_at
       FROM audit_log
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    const total = db.prepare(`SELECT COUNT(*) as n FROM audit_log ${where}`).get(...params).n;

    // Frontend: auditLogs = r.data.data || []
    return res.json({ success: true, data: rows, total, limit, offset });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/export', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC').all();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-export.json"');
    return res.send(JSON.stringify(rows, null, 2));
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
