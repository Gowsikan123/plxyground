'use strict';
const express = require('express');
const router = express.Router();

const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const logger = require('../../logger');

// GET /api/admin/analytics
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [users, businesses, content, opps, pendingQ, flaggedQ, apps] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM businesses'),
      db.query('SELECT COUNT(*) FROM content'),
      db.query('SELECT COUNT(*) FROM opportunities'),
      db.query("SELECT COUNT(*) FROM content WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) FROM content WHERE status = 'flagged'"),
      db.query('SELECT COUNT(*) FROM applications'),
    ]);

    const last7 = await db.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS posts
       FROM content
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY day ORDER BY day ASC`,
    );

    const sportBreakdown = await db.query(
      `SELECT sport, COUNT(*) AS count FROM content WHERE sport IS NOT NULL GROUP BY sport ORDER BY count DESC LIMIT 10`,
    );

    return res.json({
      kpis: {
        total_creators:    parseInt(users.rows[0].count, 10),
        total_businesses:  parseInt(businesses.rows[0].count, 10),
        total_content:     parseInt(content.rows[0].count, 10),
        total_opps:        parseInt(opps.rows[0].count, 10),
        pending_queue:     parseInt(pendingQ.rows[0].count, 10),
        flagged_queue:     parseInt(flaggedQ.rows[0].count, 10),
        total_applications: parseInt(apps.rows[0].count, 10),
      },
      content_last_7_days: last7.rows,
      sport_breakdown: sportBreakdown.rows,
    });
  } catch (err) {
    logger.error('admin.analytics error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
