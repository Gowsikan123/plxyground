const express = require('express');
const db = require('../db/setup');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/opportunities - list all published opportunities
router.get('/', async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 100);
  const off = parseInt(offset) || 0;

  const rows = await db.prepare(`
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
router.get('/mine', verifyToken, requireRole('BUSINESS'), async (req, res) => {
  const rows = await db.prepare(`
    SELECT o.*, c.name as creator_name, c.profile_slug, c.role as creator_role
    FROM opportunities o
    JOIN creators c ON c.id = o.creator_id
    WHERE o.creator_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  res.json({ data: rows });
});

// GET /api/opportunities/:id - single opportunity
router.get('/:id', async (req, res) => {
  const row = await db.prepare(`
    SELECT o.*, c.name as creator_name, c.profile_slug, c.role as creator_role
    FROM opportunities o
    JOIN creators c ON c.id = o.creator_id
    WHERE o.id = ? AND o.is_published = 1
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// POST /api/opportunities/:id/apply - apply to an opportunity (creator user)
router.post('/:id/apply', verifyToken, requireRole('CREATOR'), async (req, res) => {
  const opportunity = await db.prepare('SELECT * FROM opportunities WHERE id = ? AND is_published = 1').get(req.params.id);
  if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

  const { message } = req.body;
  const exists = await db.prepare('SELECT * FROM opportunity_applications WHERE opportunity_id = ? AND creator_id = ?').get(req.params.id, req.user.id);
  if (exists) return res.status(409).json({ error: 'Already applied' });

  const result = await db.prepare(`
    INSERT INTO opportunity_applications (opportunity_id, creator_id, message)
    VALUES (?, ?, ?)
  `).run(req.params.id, req.user.id, message || null);

  await db.prepare(`INSERT INTO audit_log (action_type, actor, target, metadata) VALUES (?, ?, ?, ?)`)
    .run('opportunity_application', req.user.id, `opportunity:${req.params.id}`, JSON.stringify({ application_id: result.lastInsertRowid, message }));

  // in real life, trigger push/email notification to opportunity owner
  console.log(`User ${req.user.id} applied to opportunity ${req.params.id}`);

  res.status(201).json({ message: 'Application submitted', applicationId: result.lastInsertRowid });
});

// POST /api/opportunities - create opportunity (auth required)
router.post('/', verifyToken, requireRole('BUSINESS'), async (req, res) => {
  const { title, role_type, body, requirements, benefits } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    const result = await db.prepare(`
      INSERT INTO opportunities (creator_id, title, role_type, body, requirements, benefits, is_published)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(req.user.id, title, role_type || null, body, requirements || null, benefits || null);

    await db.prepare(`
      INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
      VALUES ('opportunity', 'pending', ?, ?, ?)
    `).run(title, req.user.email, result.lastInsertRowid);

    const opportunity = await db.prepare('SELECT * FROM opportunities WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(opportunity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/opportunities/:id - edit opportunity (owner only, returns to moderation)
router.put('/:id', verifyToken, requireRole('BUSINESS'), async (req, res) => {
  const { title, role_type, body, requirements, benefits } = req.body;

  const opp = await db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  if (!opp) return res.status(404).json({ error: 'Not found' });
  if (opp.creator_id !== req.user.id) return res.status(403).json({ error: 'Not your opportunity' });

  await db.prepare(`
    UPDATE opportunities SET
      title = ?, role_type = ?, body = ?, requirements = ?,
      benefits = ?, is_published = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title || opp.title,
    role_type || opp.role_type,
    body || opp.body,
    requirements !== undefined ? requirements : opp.requirements,
    benefits !== undefined ? benefits : opp.benefits,
    req.params.id
  );

  const updated = await db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);

  const queueItem = await db.prepare(`
    SELECT id FROM moderation_queue
    WHERE entity_id = ? AND type = 'opportunity'
  `).get(req.params.id);

  if (queueItem) {
    await db.prepare(`
      UPDATE moderation_queue
      SET status = 'pending', title_or_name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(updated.title, queueItem.id);
  } else {
    await db.prepare(`
      INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
      VALUES ('opportunity', 'pending', ?, ?, ?)
    `).run(updated.title, req.user.email, req.params.id);
  }

  res.json(updated);
});

// DELETE /api/opportunities/:id - delete opportunity (owner only)
router.delete('/:id', verifyToken, requireRole('BUSINESS'), async (req, res) => {
  const opp = await db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  if (!opp) return res.status(404).json({ error: 'Not found' });
  if (opp.creator_id !== req.user.id) return res.status(403).json({ error: 'Not your opportunity' });

  await db.prepare('DELETE FROM opportunities WHERE id = ?').run(req.params.id);
  await db.prepare(`DELETE FROM moderation_queue WHERE entity_id = ? AND type = 'opportunity'`).run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
