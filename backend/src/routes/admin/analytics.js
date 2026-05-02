'use strict';

const express = require('express');
const router = express.Router();

const db = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const logger = require('../../logger');

// GET /api/admin/analytics  — dashboard KPIs
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [users, businesses, content, opportunities, pendingContent, recentSignups] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total, SUM(CASE WHEN is_suspended THEN 1 ELSE 0 END) AS suspended FROM users WHERE role = 'creator'`),
      db.query(`SELECT COUNT(*) AS total FROM businesses`),
      db.query(`SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
       FROM content`),
      db.query(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open FROM opportunities`),
      db.query(`SELECT COUNT(*) AS cnt FROM content WHERE status = 'pending'`),
      db.query(`SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*) AS signups
                FROM users WHERE created_at > NOW() - INTERVAL '30 days'
                GROUP BY day ORDER BY day ASC`),
    ]);

    res.json({
      kpis: {
        totalCreators:     parseInt(users.rows[0].total, 10),
        suspendedCreators: parseInt(users.rows[0].suspended, 10),
        totalBusinesses:   parseInt(businesses.rows[0].total, 10),
        totalContent:      parseInt(content.rows[0].total, 10),
        pendingContent:    parseInt(content.rows[0].pending, 10),
        approvedContent:   parseInt(content.rows[0].approved, 10),
        rejectedContent:   parseInt(content.rows[0].rejected, 10),
        totalOpportunities: parseInt(opportunities.rows[0].total, 10),
        openOpportunities:  parseInt(opportunities.rows[0].open, 10),
        queueDepth:         parseInt(pendingContent.rows[0].cnt, 10),
      },
      signupTrend: recentSignups.rows,
    });
  } catch (err) {
    logger.error('admin.analytics error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
