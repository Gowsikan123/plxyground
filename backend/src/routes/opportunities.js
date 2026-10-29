'use strict';
const express = require('express');
const { body } = require('express-validator');
const sql = require('../db/client');
const audit = require('../utils/auditLogger');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');

const router = express.Router();

// Joins the poster's display name/avatar whether a creator or a business posted it.
const SELECT_WITH_POSTER = `
  SELECT o.*,
    CASE WHEN o.posted_by_type = 'creator'
      THEN json_build_object('display_name', c.display_name, 'username', c.username, 'avatar_url', c.avatar_url)
      ELSE json_build_object('display_name', b.company_name, 'avatar_url', b.logo_url)
    END AS poster
  FROM opportunities o
  LEFT JOIN creators   c ON o.posted_by_type = 'creator'  AND c.id = o.posted_by_id
  LEFT JOIN businesses b ON o.posted_by_type = 'business' AND b.id = o.posted_by_id`;

function posterId(req) {
  return req.userType === 'creator' ? req.user.creator_id : req.user.id;
}

router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const sport = req.query.sport || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    let where = "WHERE o.status = 'published'";
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (o.title ILIKE $${params.length} OR o.description ILIKE $${params.length})`;
    }
    if (sport) {
      params.push(sport);
      where += ` AND o.sport = $${params.length}`;
    }

    const [{ rows }, { rows: countRows }] = await Promise.all([
      sql.query(
        `${SELECT_WITH_POSTER} ${where} ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      sql.query(`SELECT COUNT(*)::int AS n FROM opportunities o ${where}`, params),
    ]);

    return res.json({ success: true, data: { opportunities: rows, total: countRows[0].n, limit, offset } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    const { rows } = await sql.query(`${SELECT_WITH_POSTER} WHERE o.id = $1 AND o.status != 'deleted'`, [id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title required'),
    body('description').notEmpty().withMessage('Description required'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      const { title, description, sport = null, location = null, budget = null, deadline = null } = req.body;
      const [created] = await sql`
        INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline)
        VALUES (${req.userType}, ${posterId(req)}, ${title}, ${description}, ${sport || null}, ${location || null}, ${budget || null}, ${deadline || null})
        RETURNING *`;

      await audit.log({ actor_type: req.userType, actor_id: req.user.id, action: 'OPPORTUNITY_CREATED', target_type: 'opportunities', target_id: created.id, ip_address: req.ip });
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const [opp] = await sql`
      SELECT * FROM opportunities
      WHERE id = ${parseInt(req.params.id, 10)} AND posted_by_type = ${req.userType} AND posted_by_id = ${posterId(req)}`;
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found or not yours' });

    const pick = (key) => (req.body[key] !== undefined ? req.body[key] : opp[key]);
    const [updated] = await sql`
      UPDATE opportunities
      SET title = ${pick('title')}, description = ${pick('description')}, sport = ${pick('sport')},
          location = ${pick('location')}, budget = ${pick('budget')}, deadline = ${pick('deadline')},
          status = ${pick('status')}, updated_at = NOW()
      WHERE id = ${opp.id}
      RETURNING *`;
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const rows = await sql`
      UPDATE opportunities SET status = 'deleted', updated_at = NOW()
      WHERE id = ${parseInt(req.params.id, 10)} AND posted_by_type = ${req.userType} AND posted_by_id = ${posterId(req)}
      RETURNING id`;
    if (!rows.length) return res.status(404).json({ success: false, error: 'Opportunity not found or not yours' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
