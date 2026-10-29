'use strict';
const express = require('express');
const sql = require('../../db/client');
const audit = require('../../utils/auditLogger');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// Whitelisted per table so column names never come from user input.
const TABLES = {
  creator: { table: 'content', fields: ['title', 'body', 'status', 'media_url'] },
  business: { table: 'business_content', fields: ['title', 'body', 'status', 'budget_range', 'target_sport'] },
};
const tableFor = (req) => TABLES[req.query.type === 'business' ? 'business' : 'creator'];

// GET /api/admin/content?status=&search=&limit=&offset=
router.get('/', requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || '';
    const search = req.query.search || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;

    // Same filters on both halves of the UNION; $1 = status, $2 = search pattern.
    const params = [status || null, search ? `%${search}%` : null, limit, offset];
    const query = `
      SELECT * FROM (
        SELECT c.id, 'creator' AS type, c.title, c.status, c.media_type, c.view_count, c.created_at,
               cr.display_name AS creator_name, cr.sport
        FROM content c JOIN creators cr ON c.creator_id = cr.id
        WHERE ($1::text IS NULL OR c.status = $1) AND ($2::text IS NULL OR c.title ILIKE $2 OR cr.sport ILIKE $2)
        UNION ALL
        SELECT bc.id, 'business' AS type, bc.title, bc.status, 'text' AS media_type, 0 AS view_count, bc.created_at,
               b.company_name AS creator_name, b.industry AS sport
        FROM business_content bc JOIN businesses b ON bc.business_id = b.id
        WHERE ($1::text IS NULL OR bc.status = $1) AND ($2::text IS NULL OR bc.title ILIKE $2)
      ) items`;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      sql.query(`${query} ORDER BY created_at DESC LIMIT $3 OFFSET $4`, params),
      sql.query(`SELECT COUNT(*)::int AS n FROM (${query}) counted`, params.slice(0, 2)),
    ]);
    return res.json({ success: true, data: rows, total: countRows[0].n, limit, offset });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/content/:id?type=creator|business
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { table, fields: allowed } = tableFor(req);
    const id = parseInt(req.params.id, 10);
    const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ success: false, error: 'No valid fields to update' });

    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const { rows } = await sql.query(
      `UPDATE ${table} SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...fields.map((f) => req.body[f]), id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Content not found' });

    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_CONTENT_UPDATED', target_type: table, target_id: id, ip_address: req.ip });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/content/:id?type=creator|business
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { table } = tableFor(req);
    const id = parseInt(req.params.id, 10);
    const { rows } = await sql.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Content not found' });

    await audit.log({ actor_type: 'admin', actor_id: req.admin.id, action: 'ADMIN_CONTENT_DELETED', target_type: table, target_id: id, ip_address: req.ip });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
