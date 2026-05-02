'use strict';
const express = require('express');
const pool = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = (page - 1) * limit;
    const result = await pool.query(
      'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countRes = await pool.query('SELECT COUNT(*) FROM audit_log');
    return res.json({ data: result.rows, meta: { page, limit, total: parseInt(countRes.rows[0].count, 10) } });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

module.exports = router;
