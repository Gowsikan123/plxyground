const express = require('express');
const db = require('../db/setup');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/creators - list all creators
router.get('/', async (req, res) => {
  const { search, limit = 20, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 100);
  const off = parseInt(offset) || 0;

  let query = `
    SELECT c.*, ca.email, ca.is_suspended
    FROM creators c
    JOIN creator_accounts ca ON ca.creator_id = c.id
    WHERE c.is_active = 1
  `;
  const params = [];

  if (search) {
    query += ` AND (c.name LIKE ? OR c.bio LIKE ? OR c.location LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
  params.push(lim, off);

  try {
    const rows = await db.prepare(query).all(...params);
    res.json({ data: rows, limit: lim, offset: off });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/creators/:id - get creator by id
router.get('/:id', async (req, res) => {
  try {
    const creator = await db.prepare(`
      SELECT c.*, ca.email, ca.is_suspended
      FROM creators c
      JOIN creator_accounts ca ON ca.creator_id = c.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!creator) return res.status(404).json({ error: 'Not found' });

    const posts = await db.prepare(`
      SELECT * FROM content WHERE creator_id = ? AND is_published = 1
      ORDER BY published_at DESC
    `).all(req.params.id);

    res.json({ ...creator, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/creators/slug/:slug - get creator by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const creator = await db.prepare(`
      SELECT c.*, ca.email, ca.is_suspended
      FROM creators c
      JOIN creator_accounts ca ON ca.creator_id = c.id
      WHERE c.profile_slug = ?
    `).get(req.params.slug);

    if (!creator) return res.status(404).json({ error: 'Not found' });

    const posts = await db.prepare(`
      SELECT * FROM content WHERE creator_id = ? AND is_published = 1
      ORDER BY published_at DESC
    `).all(creator.id);

    res.json({ ...creator, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/creators/:id - edit own profile (auth required)
router.put('/:id', verifyToken, async (req, res) => {
  const { bio, location, social_links } = req.body;

  try {
    const creator = await db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
    if (!creator) return res.status(404).json({ error: 'Not found' });
    if (creator.id !== req.user.id) return res.status(403).json({ error: 'Not your profile' });

    await db.prepare(`
      UPDATE creators SET
        bio = ?, location = ?, social_links = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      bio !== undefined ? bio : creator.bio,
      location !== undefined ? location : creator.location,
      social_links ? JSON.stringify(social_links) : creator.social_links,
      req.params.id
    );

    const updated = await db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
