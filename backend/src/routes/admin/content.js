'use strict';
const express = require('express');
const db = require('../../db/client');
const audit = require('../../utils/auditLogger');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const status = req.query.status || '';
    const search = req.query.search || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    let creatorWhere = 'WHERE 1=1';
    let bizWhere = 'WHERE 1=1';
    const creatorParams = [];
    const bizParams = [];

    if (status) {
      creatorWhere += ' AND c.status = ?'; creatorParams.push(status);
      bizWhere += ' AND bc.status = ?'; bizParams.push(status);
    }
    if (search) {
      creatorWhere += ' AND c.title LIKE ?'; creatorParams.push(`%${search}%`);
      bizWhere += ' AND bc.title LIKE ?'; bizParams.push(`%${search}%`);
    }

    const creatorRows = db.prepare(
      `SELECT c.id, 'creator' as type, c.title, c.status, c.view_count, c.created_at FROM content c ${creatorWhere}`
    ).all(...creatorParams);

    const bizRows = db.prepare(
      `SELECT bc.id, 'business' as type, bc.title, bc.status, 0 as view_count, bc.created_at FROM business_content bc ${bizWhere}`
    ).all(...bizParams);

    const all = [...creatorRows, ...bizRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = all.length;
    const paged = all.slice(offset, offset + limit);

    return res.json({ success: true, data: { items: paged, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  try {
    const type = req.query.type || 'creator';
    const table = type === 'business' ? 'business_content' : 'content';
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Content not found' });

    const fields = Object.keys(req.body).filter((k) => ['title', 'body', 'status', 'media_url', 'budget_range', 'target_sport'].includes(k));
    if (fields.length === 0) return res.status(400).json({ success: false, error: 'No valid fields to update' });

    const sets = fields.map((f) => `${f}=?`).join(', ');
    const vals = fields.map((f) => req.body[f]);
    db.prepare(`UPDATE ${table} SET ${sets}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...vals, row.id);

    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_CONTENT_UPDATED', target_type: table, target_id: row.id, ip_address: req.ip });
    const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(row.id);
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const type = req.query.type || 'creator';
    const table = type === 'business' ? 'business_content' : 'content';
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Content not found' });

    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(row.id);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_CONTENT_DELETED', target_type: table, target_id: row.id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
