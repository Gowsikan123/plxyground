'use strict';

const express = require('express');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { actor_type, action, limit = 50, offset = 0, from, to } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 50, 200);
  const safeOffset = parseInt(offset, 10) || 0;
  try {
    const conditions = [];
    const params = [];
    let idx = 1;
    if (actor_type) { conditions.push(`actor_type = $${idx++}`); params.push(actor_type); }
    if (action) { conditions.push(`action ILIKE $${idx++}`); params.push(`%${action}%`); }
    if (from) { conditions.push(`created_at >= $${idx++}`); params.push(from); }
    if (to) { conditions.push(`created_at <= $${idx++}`); params.push(to); }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const countRes = await pool.query(`SELECT COUNT(*) FROM audit_logs ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    params.push(safeLimit);
    params.push(safeOffset);
    const { rows } = await pool.query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    return res.json({ data: rows, total, limit: safeLimit, offset: safeOffset });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
