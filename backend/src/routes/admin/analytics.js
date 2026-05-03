'use strict';
const express = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const total_creators = db.prepare('SELECT COUNT(*) as n FROM creators').get().n;
    const total_businesses = db.prepare('SELECT COUNT(*) as n FROM businesses').get().n;
    const total_content = db.prepare("SELECT COUNT(*) as n FROM content WHERE status != 'deleted'").get().n;
    const published_content = db.prepare("SELECT COUNT(*) as n FROM content WHERE status = 'published'").get().n;
    const pending_moderation = db.prepare("SELECT COUNT(*) as n FROM moderation_queue WHERE status = 'pending'").get().n;
    const total_opportunities = db.prepare("SELECT COUNT(*) as n FROM opportunities WHERE status != 'deleted'").get().n;

    const weekly_signups = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toISOString().slice(0, 10);
      const creators_count = db.prepare("SELECT COUNT(*) as n FROM creators WHERE DATE(created_at) = ?").get(day).n;
      const businesses_count = db.prepare("SELECT COUNT(*) as n FROM businesses WHERE DATE(created_at) = ?").get(day).n;
      weekly_signups.push({ date: day, creators: creators_count, businesses: businesses_count });
    }

    return res.json({
      success: true,
      data: {
        total_creators,
        total_businesses,
        total_content,
        published_content,
        pending_moderation,
        total_opportunities,
        weekly_signups,
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
