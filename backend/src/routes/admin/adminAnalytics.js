const express = require('express');
const db = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/analytics
router.get('/', async (req, res) => {
  const totalCreators = (await db.prepare(`SELECT COUNT(*) as count FROM creators`).get()).count;
  const totalBusinesses = (await db.prepare(`SELECT COUNT(*) as count FROM businesses`).get()).count;
  const totalContent = (await db.prepare(`SELECT COUNT(*) as count FROM content`).get()).count;
  const publishedContent = (await db.prepare(`SELECT COUNT(*) as count FROM content WHERE status = 'published'`).get()).count;
  const pendingContent = (await db.prepare(`SELECT COUNT(*) as count FROM content WHERE status = 'pending'`).get()).count;
  const totalOpportunities = (await db.prepare(`SELECT COUNT(*) as count FROM opportunities`).get()).count;
  const publishedOpportunities = (await db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE status = 'published'`).get()).count;
  const pendingOpportunities = (await db.prepare(`SELECT COUNT(*) as count FROM opportunities WHERE status = 'closed'`).get()).count;
  const last7Days = (await db.prepare(`
    SELECT COUNT(*) as count FROM content
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `).get()).count;

  const weeklyTrend = await db.prepare(`
    SELECT created_at::date as day, COUNT(*) as count
    FROM content
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY created_at::date
    ORDER BY day ASC
  `).all();

  const recentUsers = await db.prepare(`
    SELECT ca.email, c.display_name as name, ca.created_at
    FROM creator_accounts ca
    JOIN creators c ON c.id = ca.creator_id
    ORDER BY ca.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    kpis: {
      totalCreators, totalBusinesses, totalContent,
      publishedContent, pendingContent,
      totalOpportunities, publishedOpportunities, pendingOpportunities,
      last7Days
    },
    weeklyTrend,
    recentUsers
  });
});

module.exports = router;
