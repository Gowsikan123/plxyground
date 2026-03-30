const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/analytics
router.get('/', (req, res) => {
  const totalCreators = db.prepare(`SELECT COUNT(*) as count FROM creators WHERE role = 'CREATOR'`).get().count;
  const totalBusinesses = db.prepare(`SELECT COUNT(*) as count FROM creators WHERE role = 'BUSINESS'`).get().count;
  const totalContent = db.prepare(`SELECT COUNT(*) as count FROM content`).get().count;
  const publishedContent = db.prepare(`SELECT COUNT(*) as count FROM content WHERE is_published = 1`).get().count;
  const pendingContent = db.prepare(`SELECT COUNT(*) as count FROM content WHERE is_published = 0`).get().count;
  const totalOpportunities = db.prepare(`SELECT COUNT(*) as count FROM opportunities`).get().count;
  const publishedOpportunities = db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE is_published = 1`).get().count;
  const pendingOpportunities = db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE is_published = 0`).get().count;
  const last7Days = db.prepare(`
    SELECT COUNT(*) as count FROM content
    WHERE created_at >= datetime('now', '-7 days')
  `).get().count;

  const weeklyTrend = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM content
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all();

  const recentUsers = db.prepare(`
    SELECT ca.email, c.name, c.role, ca.created_at
    FROM creator_accounts ca
    JOIN creators c ON c.id = ca.creator_id
    ORDER BY ca.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    kpis: {
      totalCreators,
      totalBusinesses,
      totalContent,
      publishedContent,
      pendingContent,
      totalOpportunities,
      publishedOpportunities,
      pendingOpportunities,
      last7Days
    },
    weeklyTrend,
    recentUsers
  });
});

// GET /api/admin/alerts
router.get('/alerts', (req, res) => {
  const newContent = db.prepare(`
    SELECT 'content' as type, title as name, created_at
    FROM content
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  const newUsers = db.prepare(`
    SELECT 'user' as type, ca.email as name, ca.created_at
    FROM creator_accounts ca
    ORDER BY ca.created_at DESC
    LIMIT 10
  `).all();

  const alerts = [...newContent, ...newUsers].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  ).slice(0, 20);

  res.json({ data: alerts });
});

module.exports = router;
