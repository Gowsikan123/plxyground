const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/audit - list audit log
router.get('/', async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 2000);
  const off = parseInt(offset) || 0;

  const rows = await db.prepare(`
    SELECT * FROM audit_log
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(lim, off);

  res.json({ data: rows, limit: lim, offset: off });
});

// GET /api/admin/audit/export - export audit log as CSV
router.get('/export', async (req, res) => {
  const rows = await db.prepare(`
    SELECT * FROM audit_log ORDER BY created_at DESC
  `).all();

  const headers = ['id', 'action_type', 'actor', 'target', 'before_snapshot', 'after_snapshot', 'reason', 'metadata', 'created_at'];

  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csv = [headers.join(',')]
    .concat(rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(',')))
    .join('\n');

  res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

module.exports = router;
