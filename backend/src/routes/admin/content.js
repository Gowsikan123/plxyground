'use strict';
const { Router } = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const status = req.query.status || '';
    const search = req.query.search || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const buildWhere = (extraField) => {
      const p = [];
      let w = `WHERE 1=1`;
      if (status) { w += ` AND status = ?`; p.push(status); }
      if (search) { w += ` AND (title LIKE ? OR body LIKE ?)`; p.push(`%${search}%`, `%${search}%`); }
      return { w, p };
    };

    const { w: w1, p: p1 } = buildWhere();
    const { w: w2, p: p2 } = buildWhere();

    const creatorRows = db.prepare(
      `SELECT id, title, body, status, view_count, like_count, created_at, 'creator' as type FROM content ${w1}`
    ).all(...p1);
    const bizRows = db.prepare(
      `SELECT id, title, body, status, 0 as view_count, 0 as like_count, created_at, 'business' as type FROM business_content ${w2}`
    ).all(...p2);

    const all = [...creatorRows, ...bizRows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = all.length;
    const sliced = all.slice(offset, offset + limit);
    return res.json({ success: true, data: { content: sliced, total, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  try {
    const type = req.query.type || 'creator';
    const table = type === 'business' ? 'business_content' : 'content';
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Not found.' });
    const updates = req.body;
    const allowed = type === 'business'
      ? ['title', 'body', 'media_url', 'budget_range', 'target_sport', 'status']
      : ['title', 'body', 'media_url', 'media_type', 'tags', 'status'];
    const setClauses = [];
    const params = [];
    for (const field of allowed) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }
    if (setClauses.length === 0) return res.status(400).json({ success: false, error: 'No valid fields to update.' });
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    db.prepare(`UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_CONTENT_UPDATED', target_type: table, target_id: parseInt(req.params.id), ip_address: req.ip });
    const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
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
    if (!row) return res.status(404).json({ success: false, error: 'Not found.' });
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_CONTENT_DELETED', target_type: table, target_id: parseInt(req.params.id), ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
