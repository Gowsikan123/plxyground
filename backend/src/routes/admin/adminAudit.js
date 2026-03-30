const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/audit - list audit log
router.get('/', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 2000);
  const off = parseInt(offset) || 0;

  const rows = db.prepare(`
    SELECT * FROM audit_log
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(lim, off);

  res.json({ data: rows, limit: lim, offset: off });
});

// GET /api/admin/audit/export - export audit log as JSON
router.get('/export', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM audit_log ORDER BY created_at DESC
  `).all();

  res.setHeader('Content-Disposition', 'attachment; filename="audit-log.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(rows, null, 2));
});

module.exports = router;