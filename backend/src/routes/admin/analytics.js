'use strict';
const express = require('express');
const sql = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/analytics
// Admin panel reads: kpis.{...}, content_last_7_days [{ day, posts }], sport_breakdown [{ sport, count }]
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [[kpis], contentLast7Days, sportBreakdown] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*) FROM creators)::int                                         AS total_creators,
          (SELECT COUNT(*) FROM businesses)::int                                       AS total_businesses,
          (SELECT COUNT(*) FROM content WHERE status != 'deleted')::int                AS total_content,
          (SELECT COUNT(*) FROM opportunities WHERE status != 'deleted')::int          AS total_opps,
          (SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending')::int        AS pending_queue,
          0                                                                            AS flagged_queue,
          (SELECT COUNT(*) FROM applications)::int                                     AS total_applications`,
      sql`
        SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
               ((SELECT COUNT(*) FROM content          WHERE created_at::date = d.day)
              + (SELECT COUNT(*) FROM business_content WHERE created_at::date = d.day))::int AS posts
        FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, interval '1 day') AS d(day)
        ORDER BY d.day`,
      sql`
        SELECT sport, COUNT(*)::int AS count
        FROM creators
        WHERE sport IS NOT NULL AND sport != ''
        GROUP BY sport
        ORDER BY count DESC
        LIMIT 10`,
    ]);

    return res.json({
      success: true,
      data: { kpis, content_last_7_days: contentLast7Days, sport_breakdown: sportBreakdown },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/analytics/alerts — latest 10 audit events
router.get('/alerts', requireAdmin, async (req, res) => {
  try {
    const alerts = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`;
    return res.json({ success: true, data: alerts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
