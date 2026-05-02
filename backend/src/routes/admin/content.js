'use strict';

const express = require('express');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const auditLogger = require('../../utils/auditLogger');

const router = express.Router();

router.get('/creator-content', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { status, search, limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = parseInt(offset, 10) || 0;
  try {
    const conditions = [];
    const params = [];
    let idx = 1;
    if (status) { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (search) { conditions.push(`(c.title ILIKE $${idx} OR cr.username ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(safeLimit); params.push(safeOffset);
    const { rows } = await pool.query(
      `SELECT c.*, cr.display_name, cr.username, cr.slug AS creator_slug FROM content c JOIN creators cr ON cr.id = c.creator_id ${where} ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    return res.json({ data: rows });
  } catch (err) { throw err; }
});

router.post('/creator-content/:id/remove', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query(`UPDATE content SET status = 'removed' WHERE id = $1`, [id]);
    auditLogger.log({ actor_type: 'admin', actor_id: req.user.id, action: 'CONTENT_REMOVED', target_type: 'content', target_id: parseInt(id, 10), ip_address: req.ip, meta: { reason } });
    return res.json({ success: true });
  } catch (err) { throw err; }
});

router.get('/business-content', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { status, search, limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = parseInt(offset, 10) || 0;
  try {
    const conditions = [];
    const params = [];
    let idx = 1;
    if (status) { conditions.push(`bc.status = $${idx++}`); params.push(status); }
    if (search) { conditions.push(`(bc.title ILIKE $${idx} OR b.company_name ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    params.push(safeLimit); params.push(safeOffset);
    const { rows } = await pool.query(
      `SELECT bc.*, b.company_name, b.slug AS business_slug FROM business_content bc JOIN businesses b ON b.id = bc.business_id ${where} ORDER BY bc.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    return res.json({ data: rows });
  } catch (err) { throw err; }
});

module.exports = router;
