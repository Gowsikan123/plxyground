'use strict';

const express = require('express');
const { getPool } = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const logger = require('../../logger');

const router = express.Router();

// GET /api/admin/analytics
router.get('/', requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const [creators, businesses, content, opportunities, pendingQueue, flagged] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM creators WHERE is_suspended = FALSE'),
      pool.query('SELECT COUNT(*) FROM businesses WHERE is_suspended = FALSE'),
      pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'approved') as approved, COUNT(*) FILTER (WHERE status = 'pending') as pending, COUNT(*) FILTER (WHERE status = 'rejected') as rejected FROM content`),
      pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'open') as open, COUNT(*) as total FROM opportunities`),
      pool.query(`SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM content WHERE is_flagged = TRUE AND status = 'approved'`),
    ]);

    const sports = await pool.query(
      `SELECT sport, COUNT(*) as count FROM content WHERE sport IS NOT NULL AND status = 'approved' GROUP BY sport ORDER BY count DESC LIMIT 10`,
    );

    const signupTrend = await pool.query(
      `SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as count FROM creators WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day ASC`,
    );

    return res.json({
      creators: parseInt(creators.rows[0].count, 10),
      businesses: parseInt(businesses.rows[0].count, 10),
      content: {
        approved: parseInt(content.rows[0].approved, 10),
        pending: parseInt(content.rows[0].pending, 10),
        rejected: parseInt(content.rows[0].rejected, 10),
      },
      opportunities: {
        open: parseInt(opportunities.rows[0].open, 10),
        total: parseInt(opportunities.rows[0].total, 10),
      },
      pendingQueue: parseInt(pendingQueue.rows[0].count, 10),
      flaggedContent: parseInt(flagged.rows[0].count, 10),
      topSports: sports.rows,
      signupTrend: signupTrend.rows,
    });
  } catch (err) {
    logger.error('admin analytics error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
