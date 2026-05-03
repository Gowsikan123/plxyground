'use strict';
const express = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/analytics
// Frontend reads: r.data.kpis.{total_creators, total_businesses, total_content, total_opps,
//                               pending_queue, flagged_queue, total_applications}
//                r.data.content_last_7_days  [ { day, posts } ]
//                r.data.sport_breakdown      [ { sport, count } ]
router.get('/', requireAdmin, (req, res) => {
  try {
    const total_creators   = db.prepare('SELECT COUNT(*) as n FROM creators').get().n;
    const total_businesses = db.prepare('SELECT COUNT(*) as n FROM businesses').get().n;
    const total_content    = db.prepare("SELECT COUNT(*) as n FROM content WHERE status != 'deleted'").get().n;
    const total_opps       = db.prepare("SELECT COUNT(*) as n FROM opportunities WHERE status != 'deleted'").get().n;
    const pending_queue    = db.prepare("SELECT COUNT(*) as n FROM moderation_queue WHERE status = 'pending'").get().n;
    const flagged_queue    = db.prepare("SELECT COUNT(*) as n FROM moderation_queue WHERE status = 'flagged'").get().n;

    // total_applications — check opportunities_applications table; fall back to 0 if missing
    let total_applications = 0;
    try {
      total_applications = db.prepare('SELECT COUNT(*) as n FROM opportunity_applications').get().n;
    } catch (_) { /* table may not exist yet */ }

    // content_last_7_days: posts per day from both content tables
    const content_last_7_days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.toISOString().slice(0, 10);
      const creator_posts  = db.prepare("SELECT COUNT(*) as n FROM content          WHERE DATE(created_at) = ?").get(day).n;
      const business_posts = db.prepare("SELECT COUNT(*) as n FROM business_content WHERE DATE(created_at) = ?").get(day).n;
      content_last_7_days.push({ day, posts: creator_posts + business_posts });
    }

    // sport_breakdown: top sports by creator count
    const sport_breakdown = db.prepare(
      `SELECT sport, COUNT(*) as count
       FROM creators
       WHERE sport IS NOT NULL AND sport != ''
       GROUP BY sport
       ORDER BY count DESC
       LIMIT 10`
    ).all();

    return res.json({
      success: true,
      data: {
        kpis: {
          total_creators,
          total_businesses,
          total_content,
          total_opps,
          pending_queue,
          flagged_queue,
          total_applications,
        },
        content_last_7_days,
        sport_breakdown,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/alerts', requireAdmin, (req, res) => {
  try {
    const alerts = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10').all();
    return res.json({ success: true, data: alerts });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
