'use strict';
const { Router } = require('express');
const db = require('../../db/client');
const { requireAuth } = require('../../middleware/auth');
const logger = require('../../logger');

const router = Router();
const adminOnly = requireAuth('admin');

router.get('/', adminOnly, (_req, res) => {
  try {
    const totalCreators = db.prepare('SELECT COUNT(*) as n FROM creators').get().n;
    const totalBusinesses = db.prepare('SELECT COUNT(*) as n FROM businesses').get().n;
    const totalContent = db.prepare(`SELECT COUNT(*) as n FROM content WHERE status = 'published'`).get().n;
    const pendingQueue = db.prepare(`SELECT COUNT(*) as n FROM moderation_queue WHERE status = 'pending'`).get().n;
    const totalOpportunities = db.prepare(`SELECT COUNT(*) as n FROM opportunities WHERE status = 'published'`).get().n;
    const recentContent = db.prepare(`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM content WHERE created_at >= DATE('now', '-7 days')
      GROUP BY day ORDER BY day ASC
    `).all();
    res.json({
      data: {
        totalCreators,
        totalBusinesses,
        totalContent,
        pendingQueue,
        totalOpportunities,
        recentContent,
      }
    });
  } catch (err) {
    logger.error('Analytics error', { message: err.message });
    res.status(500).json({ error: 'Could not load analytics.' });
  }
});

module.exports = router;
