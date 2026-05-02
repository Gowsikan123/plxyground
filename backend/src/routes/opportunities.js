'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getPool } = require('../db/client');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function enrichOpportunity(opp, pool) {
  let poster = null;
  if (opp.posted_by_type === 'creator') {
    const { rows } = await pool.query(`SELECT id, display_name, username, slug, avatar_url FROM creators WHERE id = $1`, [opp.posted_by_id]);
    if (rows.length > 0) poster = { ...rows[0], type: 'creator' };
  } else {
    const { rows } = await pool.query(`SELECT id, company_name, slug, logo_url FROM businesses WHERE id = $1`, [opp.posted_by_id]);
    if (rows.length > 0) poster = { ...rows[0], type: 'business' };
  }
  return { ...opp, poster };
}

router.get('/', async (req, res) => {
  const pool = getPool();
  const { search, sport, limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(parseInt(limit, 10) || 20, 100);
  const safeOffset = parseInt(offset, 10) || 0;
  try {
    const conditions = ["status = 'published'"];
    const params = [];
    let idx = 1;
    if (search) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (sport) {
      conditions.push(`sport ILIKE $${idx}`);
      params.push(`%${sport}%`);
      idx++;
    }
    const where = 'WHERE ' + conditions.join(' AND ');
    const countRes = await pool.query(`SELECT COUNT(*) FROM opportunities ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    params.push(safeLimit);
    params.push(safeOffset);
    const { rows } = await pool.query(
      `SELECT * FROM opportunities ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    const enriched = await Promise.all(rows.map((r) => enrichOpportunity(r, pool)));
    return res.json({ data: enriched, total, limit: safeLimit, offset: safeOffset });
  } catch (err) {
    throw err;
  }
});

router.get('/:id', async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`SELECT * FROM opportunities WHERE id = $1 AND status = 'published'`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    const enriched = await enrichOpportunity(rows[0], pool);
    return res.json({ data: enriched });
  } catch (err) {
    throw err;
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
  ],
  validate,
  async (req, res) => {
    const pool = getPool();
    const { title, description, sport, location, budget, deadline } = req.body;
    const postedById = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    try {
      const { rows } = await pool.query(
        `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.userType, postedById, title, description, sport || null, location || null, budget || null, deadline || null]
      );
      return res.status(201).json({ data: rows[0] });
    } catch (err) {
      throw err;
    }
  }
);

router.put('/:id', requireAuth, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  const postedById = req.userType === 'creator' ? req.user.creator_id : req.user.id;
  try {
    const { rows: existing } = await pool.query(`SELECT * FROM opportunities WHERE id = $1`, [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    const opp = existing[0];
    if (opp.posted_by_type !== req.userType || opp.posted_by_id !== postedById) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    const { title, description, sport, location, budget, deadline, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE opportunities SET title = COALESCE($1, title), description = COALESCE($2, description), sport = COALESCE($3, sport), location = COALESCE($4, location), budget = COALESCE($5, budget), deadline = COALESCE($6, deadline), status = COALESCE($7, status), updated_at = NOW() WHERE id = $8 RETURNING *`,
      [title || null, description || null, sport || null, location || null, budget || null, deadline || null, status || null, id]
    );
    return res.json({ data: rows[0] });
  } catch (err) {
    throw err;
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const pool = getPool();
  const { id } = req.params;
  const postedById = req.userType === 'creator' ? req.user.creator_id : req.user.id;
  try {
    const { rows: existing } = await pool.query(`SELECT * FROM opportunities WHERE id = $1`, [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
    const opp = existing[0];
    if (opp.posted_by_type !== req.userType || opp.posted_by_id !== postedById) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    await pool.query(`UPDATE opportunities SET status = 'deleted' WHERE id = $1`, [id]);
    return res.json({ success: true });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
