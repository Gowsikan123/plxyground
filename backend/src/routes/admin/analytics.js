'use strict';
const express = require('express');
const pool = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

router.get('/overview', async (req, res) => {
  try {
    const [creators, businesses, content, pending, opportunities, recentAudit] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM creators'),
      pool.query('SELECT COUNT(*) FROM businesses'),
      pool.query("SELECT COUNT(*) FROM content WHERE status='published'"),
      pool.query("SELECT COUNT(*) FROM moderation_queue WHERE status='pending'"),
      pool.query("SELECT COUNT(*) FROM opportunities WHERE status='published'"),
      pool.query('SELECT action, COUNT(*) AS count FROM audit_log GROUP BY action ORDER BY count DESC LIMIT 10'),
    ]);
    return res.json({
      totals: {
        creators: parseInt(creators.rows[0].count, 10),
        businesses: parseInt(businesses.rows[0].count, 10),
        published_content: parseInt(content.rows[0].count, 10),
        pending_moderation: parseInt(pending.rows[0].count, 10),
        opportunities: parseInt(opportunities.rows[0].count, 10),
      },
      recent_audit_actions: recentAudit.rows,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
