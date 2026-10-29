'use strict';
const express = require('express');
const sql = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/audit?actor_type=&action=&limit=&offset=
// metadata is aliased to meta for the admin panel.
router.get('/', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = parseInt(req.query.offset, 10) || 0;

    let where = 'WHERE 1=1';
    const params = [];
    if (req.query.actor_type) {
      params.push(req.query.actor_type);
      where += ` AND actor_type = $${params.length}`;
    }
    if (req.query.action) {
      params.push(`%${req.query.action}%`);
      where += ` AND action ILIKE $${params.length}`;
    }

    const [{ rows }, { rows: countRows }] = await Promise.all([
      sql.query(
        `SELECT id, actor_type, actor_id, action, target_type, target_id, ip_address, metadata AS meta, created_at
         FROM audit_logs ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      sql.query(`SELECT COUNT(*)::int AS n FROM audit_logs ${where}`, params),
    ]);
    return res.json({ success: true, data: rows, total: countRows[0].n, limit, offset });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/audit/export — full log as a JSON download
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-export.json"');
    return res.send(JSON.stringify(rows, null, 2));
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
