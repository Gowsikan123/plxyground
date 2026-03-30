const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/alerts - recent activity
router.get('/', (req, res) => {
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
