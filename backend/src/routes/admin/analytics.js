'use strict';
const express = require('express');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// GET /api/admin/analytics
router.get('/', requireAdmin, (req, res) => {
  try {
    const total_creators = db.prepare('SELECT COUNT(*) as c FROM creator_accounts').get().c;
    const total_businesses = db.prepare('SELECT COUNT(*) as c FROM businesses').get().c;
    const total_content = db.prepare('SELECT COUNT(*) as c FROM content').get().c;
    const pending_moderation = db.prepare(`SELECT COUNT(*) as c FROM moderation_queue WHERE status = 'pending'`).get().c;

    const weekly_signups = [];
    for (let i = 6; i >= 0; i--) {
      const row = db.prepare(`
        SELECT COUNT(*) as c FROM creator_accounts
        WHERE date(created_at) = date('now', '-' || ? || ' days')
      `).get(i);
      weekly_signups.push({ day: i, count: row.c });
    }

    return res.json({ success: true, data: { total_creators, total_businesses, total_content, pending_moderation, weekly_signups } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/admin/alerts
router.get('/alerts', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10').all();
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
