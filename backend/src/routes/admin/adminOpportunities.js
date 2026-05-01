const express = require('express');
const db = require('../../db/setup');
const { verifyToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/opportunities - list all opportunities
router.get('/', async (req, res) => {
  const { search, limit = 2000, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit), 1), 2000);
  const off = parseInt(offset) || 0;

  let query = `
    SELECT o.*, c.name as creator_name, c.profile_slug
    FROM opportunities o
    JOIN creators c ON c.id = o.creator_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (o.title LIKE ? OR o.body LIKE ? OR c.name LIKE ? OR o.role_type LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
  params.push(lim, off);

  const rows = await db.prepare(query).all(...params);
  res.json({ data: rows, limit: lim, offset: off });
});

// PUT /api/admin/opportunities/:id - approve/publish/unpublish/update
router.put('/:id', async (req, res) => {
  const { title, role_type, body, requirements, benefits, is_published, moderation_status } = req.body;

  const opportunity = await db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  if (!opportunity) return res.status(404).json({ error: 'Not found' });

  const before = JSON.stringify(opportunity);

  await db.prepare(`
    UPDATE opportunities SET
      title = ?,
      role_type = ?,
      body = ?,
      requirements = ?,
      benefits = ?,
      is_published = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || opportunity.title,
    role_type || opportunity.role_type,
    body || opportunity.body,
    requirements !== undefined ? requirements : opportunity.requirements,
    benefits !== undefined ? benefits : opportunity.benefits,
    is_published !== undefined ? is_published : opportunity.is_published,
    req.params.id
  );

  const after = await db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  const nextPublishedState = is_published !== undefined ? is_published : opportunity.is_published;
  const nextModerationStatus =
    moderation_status || (nextPublishedState ? 'approved' : 'pending');

  await db.prepare(`
    INSERT INTO audit_log (action_type, actor, target, before_snapshot, after_snapshot)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    nextPublishedState ? 'PUBLISH_OPPORTUNITY' : 'UNPUBLISH_OPPORTUNITY',
    req.user.email,
    `opportunity:${req.params.id}`,
    before,
    JSON.stringify(after)
  );

  if (is_published !== undefined || moderation_status) {
    const updated = await db.prepare(`
      UPDATE moderation_queue
      SET status = ?, updated_at = datetime('now')
      WHERE entity_id = ? AND type = 'opportunity'
    `).run(nextModerationStatus, req.params.id);

    if (updated.changes === 0) {
      await db.prepare(`
        INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
        VALUES ('opportunity', ?, ?, ?, ?)
      `).run(nextModerationStatus, after.title, req.user.email, req.params.id);
    }
  }

  res.json(after);
});

// DELETE /api/admin/opportunities/:id
router.delete('/:id', async (req, res) => {
  const opportunity = await db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
  if (!opportunity) return res.status(404).json({ error: 'Not found' });

  await db.prepare(`
    INSERT INTO audit_log (action_type, actor, target, before_snapshot)
    VALUES ('DELETE_OPPORTUNITY', ?, ?, ?)
  `).run(req.user.email, `opportunity:${req.params.id}`, JSON.stringify(opportunity));

  await db.prepare('DELETE FROM opportunities WHERE id = ?').run(req.params.id);
  await db.prepare(`DELETE FROM moderation_queue WHERE entity_id = ? AND type = 'opportunity'`).run(req.params.id);

  res.json({ message: 'Deleted' });
});

module.exports = router;
