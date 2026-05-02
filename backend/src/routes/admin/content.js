'use strict';
const express = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const auditLogger = require('../../utils/auditLogger');

const router = express.Router();

// GET /api/admin/content
router.get('/', requireAdmin, (req, res) => {
  try {
    const status = req.query.status || '';
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    let sql = 'SELECT c.*, cr.display_name AS creator_name FROM content c JOIN creators cr ON cr.id = c.creator_id WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND c.status = ?'; params.push(status); }
    if (search) { sql += ' AND (c.title LIKE ? OR c.body LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = db.prepare(sql).all(...params);
    const total = db.prepare('SELECT COUNT(*) as c FROM content').get().c;
    return res.json({ success: true, data: { items: rows, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/admin/content/:id
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found' });
    const { status, title, body: bodyText } = req.body;
    db.prepare('UPDATE content SET status = ?, title = ?, body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status ?? row.status, title ?? row.title, bodyText ?? row.body, row.id);
    auditLogger.log({ actor_type: 'admin', actor_id: req.admin.sub, action: 'CONTENT_UPDATED', target_type: 'content', target_id: row.id, ip_address: req.ip });
    return res.json({ success: true, data: db.prepare('SELECT * FROM content WHERE id = ?').get(row.id) });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/admin/content/:id
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM content WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found' });
    db.prepare('DELETE FROM content WHERE id = ?').run(row.id);
    auditLogger.log({ actor_type: 'admin', actor_id: req.admin.sub, action: 'CONTENT_DELETED', target_type: 'content', target_id: row.id, ip_address: req.ip });
    return res.json({ success: true, data: { message: 'Hard deleted' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
