const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/analytics
router.get('/', async (req, res) => {
  const totalCreators = (await db.prepare(`SELECT COUNT(*) as count FROM creators WHERE role = 'CREATOR'`).get()).count;
  const totalBusinesses = (await db.prepare(`SELECT COUNT(*) as count FROM creators WHERE role = 'BUSINESS'`).get()).count;
  const totalContent = (await db.prepare(`SELECT COUNT(*) as count FROM content`).get()).count;
  const publishedContent = (await db.prepare(`SELECT COUNT(*) as count FROM content WHERE is_published = 1`).get()).count;
  const pendingContent = (await db.prepare(`SELECT COUNT(*) as count FROM content WHERE is_published = 0`).get()).count;
  const totalOpportunities = (await db.prepare(`SELECT COUNT(*) as count FROM opportunities`).get()).count;
  const publishedOpportunities = (await db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE is_published = 1`).get()).count;
  const pendingOpportunities = (await db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE is_published = 0`).get()).count;
  const last7Days = (await db.prepare(`
    SELECT COUNT(*) as count FROM content
    WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  `).get()).count;

  const weeklyTrend = await db.prepare(`
    SELECT CAST(created_at AS DATE) as day, COUNT(*) as count
    FROM content
    WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    GROUP BY CAST(created_at AS DATE)
    ORDER BY day ASC
  `).all();

  const recentUsers = await db.prepare(`
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
router.get('/alerts', async (req, res) => {
  const newContent = await db.prepare(`
    SELECT 'content' as type, title as name, created_at
    FROM content
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  const newUsers = await db.prepare(`
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
