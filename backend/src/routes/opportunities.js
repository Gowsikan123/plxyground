const express = require('express');
const db = require('../db/setup');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/opportunities - list all published opportunities
router.get('/', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 100);
  const off = parseInt(offset) || 0;

  const rows = db.prepare(`
    SELECT o.*, c.name as creator_name, c.profile_slug, c.role as creator_role
    FROM opportunities o
    JOIN creators c ON c.id = o.creator_id
    WHERE o.is_published = 1
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(lim, off);

  res.json({ data: rows, limit: lim, offset: off });
});

// GET /api/opportunities/mine - list all opportunities for the authenticated business
router.get('/mine', verifyToken, requireRole('BUSINESS'), (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, c.name as creator_name, c.profile_slug, c.role as creator_role
    FROM opportunities o
    JOIN creators c ON c.id = o.creator_id
    WHERE o.creator_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  res.json({ data: rows });
});

// GET /api/opportunities/:id - single opportunity
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT o.*, c.name as creator_name, c.profile_slug, c.role as creator_role
    FROM opportunities o
    JOIN creators c ON c.id = o.creator_id
    WHERE o.id = ? AND o.is_published = 1
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/opportunities - create opportunity (auth required)
router.post('/', verifyToken, requireRole('BUSINESS'), (req, res) => {
  const { title, role_type, body, requirements, benefits } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO opportunities (creator_id, title, role_type, body, requirements, benefits, is_published)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(req.user.id, title, role_type || null, body, requirements || null, benefits || null);

    db.prepare(`
      INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
      VALUES ('opportunity', 'pending', ?, ?, ?)
    `).run(title, req.user.email, result.lastInsertRowid);

    const opportunity = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(opportunity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/opportunities/:id - edit opportunity (owner only)
router.put('/:id', verifyToken, requireRole('BUSINESS'), (req, res) => {
  const { title, role_type, body, requirements, benefits, is_published } = req.body;

  const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  if (!opp) return res.status(404).json({ error: 'Not found' });
  if (opp.creator_id !== req.user.id) return res.status(403).json({ error: 'Not your opportunity' });

  db.prepare(`
    UPDATE opportunities SET
      title = ?, role_type = ?, body = ?, requirements = ?,
      benefits = ?, is_published = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || opp.title,
    role_type || opp.role_type,
    body || opp.body,
    requirements || opp.requirements,
    benefits || opp.benefits,
    is_published !== undefined ? is_published : opp.is_published,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);

  if (is_published !== undefined) {
    db.prepare(`
      UPDATE moderation_queue
      SET status = ?, updated_at = datetime('now')
      WHERE entity_id = ? AND type = 'opportunity'
    `).run(is_published ? 'approved' : 'pending', req.params.id);
  }

  res.json(updated);
});

// DELETE /api/opportunities/:id - delete opportunity (owner only)
router.delete('/:id', verifyToken, requireRole('BUSINESS'), (req, res) => {
  const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  if (!opp) return res.status(404).json({ error: 'Not found' });
  if (opp.creator_id !== req.user.id) return res.status(403).json({ error: 'Not your opportunity' });

  db.prepare('DELETE FROM opportunities WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
