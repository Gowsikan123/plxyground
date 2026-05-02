'use strict';

const router = require('express').Router();
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const logger = require('../../logger');

// GET /api/admin/analytics — platform-wide KPIs
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [creators, businesses, content, opportunities, pendingQueue, recentSignups] = await Promise.all([
      db.query('SELECT COUNT(*) FROM creators'),
      db.query('SELECT COUNT(*) FROM businesses'),
      db.query("SELECT COUNT(*) FROM content WHERE status = 'approved'"),
      db.query("SELECT COUNT(*) FROM opportunities WHERE status = 'active'"),
      db.query("SELECT COUNT(*) FROM content WHERE status = 'pending'"),
      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM creators
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY day ASC`
      ),
    ]);

    return res.json({
      kpis: {
        total_creators: parseInt(creators.rows[0].count),
        total_businesses: parseInt(businesses.rows[0].count),
        approved_content: parseInt(content.rows[0].count),
        active_opportunities: parseInt(opportunities.rows[0].count),
        pending_queue: parseInt(pendingQueue.rows[0].count),
      },
      creator_signups_30d: recentSignups.rows,
    });
  } catch (err) {
    logger.error('Analytics error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/analytics/content — content breakdown by type and status
router.get('/content', requireAdmin, async (req, res) => {
  try {
    const [byType, byStatus, topCreators] = await Promise.all([
      db.query(
        `SELECT content_type, COUNT(*) AS count
         FROM content GROUP BY content_type ORDER BY count DESC`
      ),
      db.query(
        `SELECT status, COUNT(*) AS count
         FROM content GROUP BY status ORDER BY count DESC`
      ),
      db.query(
        `SELECT cr.id, cr.display_name, cr.username, cr.sport,
                COUNT(c.id) AS content_count
         FROM creators cr
         LEFT JOIN content c ON c.creator_id = cr.id AND c.status = 'approved'
         GROUP BY cr.id
         ORDER BY content_count DESC
         LIMIT 10`
      ),
    ]);

    return res.json({
      by_type: byType.rows,
      by_status: byStatus.rows,
      top_creators: topCreators.rows,
    });
  } catch (err) {
    logger.error('Analytics content error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
