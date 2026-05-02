const express = require('express');
const pool = require('../../db/client');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/content
router.get('/', async (req, res) => {
  const { search, limit = 2000, offset = 0 } = req.query;
  const lim = Math.min(Math.max(parseInt(limit) || 2000, 1), 2000);
  const off = parseInt(offset) || 0;

  try {
    let query = `
      SELECT c.*, cr.display_name AS creator_name, cr.slug AS profile_slug
      FROM content c
      JOIN creators cr ON cr.id = c.creator_id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND (c.title ILIKE $${idx} OR c.body ILIKE $${idx + 1} OR cr.display_name ILIKE $${idx + 2})`;
      const s = `%${search}%`;
      params.push(s, s, s);
      idx += 3;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(lim, off);

    const { rows } = await pool.query(query, params);
    res.json({ data: rows, limit: lim, offset: off });
  } catch (err) {
    console.error('Admin content list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/content/:id
router.put('/:id', async (req, res) => {
  const { is_published, title, body, media_url } = req.body;

  try {
    const { rows: existing } = await pool.query('SELECT * FROM content WHERE id = $1', [req.params.id]);
    const post = existing[0];
    if (!post) return res.status(404).json({ error: 'Not found' });

    const before = JSON.stringify(post);

    const fields = [];
    const params = [];
    let idx = 1;

    if (is_published !== undefined) { fields.push(`is_published=$${idx++}`); params.push(is_published); }
    if (title      !== undefined) { fields.push(`title=$${idx++}`);      params.push(title); }
    if (body       !== undefined) { fields.push(`body=$${idx++}`);       params.push(body); }
    if (media_url  !== undefined) { fields.push(`media_url=$${idx++}`);  params.push(media_url); }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    // Set published_at when publishing for the first time
    if (is_published && !post.is_published) {
      fields.push(`published_at=NOW()`);
    }
    fields.push(`updated_at=NOW()`);
    params.push(req.params.id);

    const { rows: updated } = await pool.query(
      `UPDATE content SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`,
      params
    );
    const after = updated[0];

    await pool.query(
      `INSERT INTO audit_log (action_type, actor, target, before_snapshot, after_snapshot)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        is_published ? 'PUBLISH_CONTENT' : 'UNPUBLISH_CONTENT',
        req.user.email,
        `content:${req.params.id}`,
        before,
        JSON.stringify(after)
      ]
    );

    if (is_published) {
      await pool.query(
        `UPDATE moderation_queue SET status = 'approved', reviewed_at = NOW()
         WHERE content_id = $1 AND content_type = 'creator_content'`,
        [req.params.id]
      );
    }

    res.json(after);
  } catch (err) {
    console.error('Admin content update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/content/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM content WHERE id = $1', [req.params.id]);
    const post = rows[0];
    if (!post) return res.status(404).json({ error: 'Not found' });

    await pool.query(
      `INSERT INTO audit_log (action_type, actor, target, before_snapshot)
       VALUES ('DELETE_CONTENT', $1, $2, $3)`,
      [req.user.email, `content:${req.params.id}`, JSON.stringify(post)]
    );

    await pool.query('DELETE FROM content WHERE id = $1', [req.params.id]);
    await pool.query(
      `DELETE FROM moderation_queue WHERE content_id = $1 AND content_type = 'creator_content'`,
      [req.params.id]
    );

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Admin content delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
