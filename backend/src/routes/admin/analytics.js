'use strict';

const express = require('express');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/overview', requireAdmin, async (req, res) => {
  const pool = getPool();
  try {
    const [creatorsRes, businessesRes, contentRes, pendingRes, oppsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM creators`),
      pool.query(`SELECT COUNT(*) FROM businesses`),
      pool.query(`SELECT COUNT(*) FROM content WHERE status = 'published'`),
      pool.query(`SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM opportunities WHERE status = 'published'`),
    ]);
    return res.json({
      total_creators: parseInt(creatorsRes.rows[0].count, 10),
      total_businesses: parseInt(businessesRes.rows[0].count, 10),
      published_content: parseInt(contentRes.rows[0].count, 10),
      pending_moderation: parseInt(pendingRes.rows[0].count, 10),
      active_opportunities: parseInt(oppsRes.rows[0].count, 10),
    });
  } catch (err) {
    throw err;
  }
});

router.get('/signups', requireAdmin, async (req, res) => {
  const pool = getPool();
  const { days = 30 } = req.query;
  const safeDays = Math.min(parseInt(days, 10) || 30, 365);
  try {
    const [creatorsRes, businessesRes] = await Promise.all([
      pool.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM creators WHERE created_at >= NOW() - INTERVAL '${safeDays} days' GROUP BY DATE(created_at) ORDER BY date ASC`
      ),
      pool.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM businesses WHERE created_at >= NOW() - INTERVAL '${safeDays} days' GROUP BY DATE(created_at) ORDER BY date ASC`
      ),
    ]);
    return res.json({
      creators: creatorsRes.rows,
      businesses: businessesRes.rows,
    });
  } catch (err) {
    throw err;
  }
});

router.get('/content-stats', requireAdmin, async (req, res) => {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) AS count FROM content GROUP BY status ORDER BY count DESC`
    );
    const { rows: topContent } = await pool.query(
      `SELECT c.id, c.title, c.view_count, cr.display_name, cr.username FROM content c JOIN creators cr ON cr.id = c.creator_id WHERE c.status = 'published' ORDER BY c.view_count DESC LIMIT 10`
    );
    return res.json({ by_status: rows, top_content: topContent });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
