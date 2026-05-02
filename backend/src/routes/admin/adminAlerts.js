const express = require('express');
const db = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/alerts
router.get('/', async (req, res) => {
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
