'use strict';
const { Router } = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  try {
    const total_creators = db.prepare('SELECT COUNT(*) as count FROM creators').get().count;
    const total_businesses = db.prepare('SELECT COUNT(*) as count FROM businesses').get().count;
    const total_content = db.prepare("SELECT COUNT(*) as count FROM content WHERE status != 'deleted'").get().count;
    const published_content = db.prepare("SELECT COUNT(*) as count FROM content WHERE status = 'published'").get().count;
    const pending_moderation = db.prepare("SELECT COUNT(*) as count FROM moderation_queue WHERE status = 'pending'").get().count;
    const total_opportunities = db.prepare("SELECT COUNT(*) as count FROM opportunities WHERE status != 'deleted'").get().count;

    const weekly_signups = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const creators_count = db.prepare("SELECT COUNT(*) as count FROM creators WHERE DATE(created_at) = ?").get(dateStr).count;
      const businesses_count = db.prepare("SELECT COUNT(*) as count FROM businesses WHERE DATE(created_at) = ?").get(dateStr).count;
      weekly_signups.push({ date: dateStr, creators: creators_count, businesses: businesses_count });
    }

    return res.json({
      success: true,
      data: { total_creators, total_businesses, total_content, published_content, pending_moderation, total_opportunities, weekly_signups },
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
