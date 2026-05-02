const express = require('express');
const pool = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/opportunities
router.get('/', async (req, res) => {
  const { search, limit = 2000, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit) || 2000, 1), 2000);
  const off = parseInt(offset) || 0;

  try {
    let query = `
      SELECT o.*,
             COALESCE(cr.display_name, b.name) AS creator_name,
             COALESCE(cr.slug, b.slug)         AS profile_slug
      FROM opportunities o
      LEFT JOIN creators  cr ON cr.id = o.posted_by_id AND o.posted_by_type = 'creator'
      LEFT JOIN businesses b  ON b.id  = o.posted_by_id AND o.posted_by_type = 'business'
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND (o.title ILIKE $${idx} OR o.description ILIKE $${idx + 1} OR COALESCE(cr.display_name, b.name) ILIKE $${idx + 2} OR o.role_type ILIKE $${idx + 3})`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
      idx += 4;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(lim, off);

    const { rows } = await pool.query(query, params);
    res.json({ data: rows, limit: lim, offset: off });
  } catch (err) {
    console.error('Admin opportunities list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/opportunities/:id
router.put('/:id', async (req, res) => {
  const { title, role_type, description, is_published, moderation_status } = req.body;

  try {
    const { rows: existing } = await pool.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
    const opp = existing[0];
    if (!opp) return res.status(404).json({ error: 'Not found' });

    const before = JSON.stringify(opp);
    const fields = [];
    const params = [];
    let idx = 1;

    if (title        !== undefined) { fields.push(`title=$${idx++}`);       params.push(title); }
    if (role_type    !== undefined) { fields.push(`role_type=$${idx++}`);   params.push(role_type); }
    if (description  !== undefined) { fields.push(`description=$${idx++}`); params.push(description); }
    if (is_published !== undefined) { fields.push(`is_published=$${idx++}`); params.push(is_published); }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`updated_at=NOW()`);
    params.push(req.params.id);

    const { rows: updated } = await pool.query(
      `UPDATE opportunities SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`,
      params
    );
    const after = updated[0];

    const nextPublished = is_published !== undefined ? is_published : opp.is_published;
    await pool.query(
      `INSERT INTO audit_log (action_type, actor, target, before_snapshot, after_snapshot)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        nextPublished ? 'PUBLISH_OPPORTUNITY' : 'UNPUBLISH_OPPORTUNITY',
        req.user.email,
        `opportunity:${req.params.id}`,
        before,
        JSON.stringify(after)
      ]
    );

    const queueStatus = moderation_status || (nextPublished ? 'approved' : 'pending');
    const { rowCount } = await pool.query(
      `UPDATE moderation_queue SET status = $1, reviewed_at = NOW()
       WHERE content_id = $2 AND content_type = 'opportunity'`,
      [queueStatus, req.params.id]
    );
    if (rowCount === 0) {
      await pool.query(
        `INSERT INTO moderation_queue (content_type, status, content_id) VALUES ('opportunity', $1, $2)`,
        [queueStatus, req.params.id]
      );
    }

    res.json(after);
  } catch (err) {
    console.error('Admin opportunity update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/opportunities/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
    const opp = rows[0];
    if (!opp) return res.status(404).json({ error: 'Not found' });

    await pool.query(
      `INSERT INTO audit_log (action_type, actor, target, before_snapshot)
       VALUES ('DELETE_OPPORTUNITY', $1, $2, $3)`,
      [req.user.email, `opportunity:${req.params.id}`, JSON.stringify(opp)]
    );

    await pool.query('DELETE FROM opportunities WHERE id = $1', [req.params.id]);
    await pool.query(
      `DELETE FROM moderation_queue WHERE content_id = $1 AND content_type = 'opportunity'`,
      [req.params.id]
    );

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Admin opportunity delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
