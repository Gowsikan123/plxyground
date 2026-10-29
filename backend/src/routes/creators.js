'use strict';
const express = require('express');
const sql = require('../db/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function creatorWithPosts(creator) {
  const posts = await sql`
    SELECT * FROM content
    WHERE creator_id = ${creator.id} AND status = 'published'
    ORDER BY created_at DESC LIMIT 20`;
  return { creator, posts };
}

router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (c.display_name ILIKE $${params.length} OR c.username ILIKE $${params.length} OR c.bio ILIKE $${params.length})`;
    }
    if (sport) {
      params.push(sport);
      where += ` AND c.sport = $${params.length}`;
    }

    const [{ rows: creators }, { rows: countRows }] = await Promise.all([
      sql.query(
        `SELECT c.* FROM creators c ${where} ORDER BY c.follower_count DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      sql.query(`SELECT COUNT(*)::int AS n FROM creators c ${where}`, params),
    ]);

    return res.json({ success: true, data: { creators, total: countRows[0].n, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const [creator] = await sql`SELECT * FROM creators WHERE slug = ${req.params.slug}`;
    if (!creator) return res.status(404).json({ success: false, error: 'Creator not found' });
    return res.json({ success: true, data: await creatorWithPosts(creator) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(404).json({ success: false, error: 'Creator not found' });
    const [creator] = await sql`SELECT * FROM creators WHERE id = ${id}`;
    if (!creator) return res.status(404).json({ success: false, error: 'Creator not found' });
    return res.json({ success: true, data: await creatorWithPosts(creator) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'creator') return res.status(403).json({ success: false, error: 'Creator access required' });
    if (req.user.creator_id !== parseInt(req.params.id, 10)) {
      return res.status(403).json({ success: false, error: 'Cannot update another creator profile' });
    }
    const [existing] = await sql`SELECT * FROM creators WHERE id = ${req.user.creator_id}`;
    if (!existing) return res.status(404).json({ success: false, error: 'Creator not found' });

    const pick = (key) => (req.body[key] !== undefined ? req.body[key] : existing[key]);
    const [updated] = await sql`
      UPDATE creators
      SET display_name = ${pick('display_name')}, bio = ${pick('bio')}, avatar_url = ${pick('avatar_url')},
          sport = ${pick('sport')}, location = ${pick('location')}, updated_at = NOW()
      WHERE id = ${existing.id}
      RETURNING *`;
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
