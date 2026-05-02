'use strict';
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

async function getPosterId(type, id, client) {
  const db = client || pool;
  if (type === 'creator') {
    const { rows } = await db.query('SELECT display_name, username, slug FROM creators WHERE id = $1', [id]);
    return rows[0] ? { poster_name: rows[0].display_name, poster_username: rows[0].username, poster_slug: rows[0].slug } : {};
  }
  const { rows } = await db.query('SELECT company_name, slug FROM businesses WHERE id = $1', [id]);
  return rows[0] ? { poster_name: rows[0].company_name, poster_slug: rows[0].slug } : {};
}

router.get('/', async (req, res) => {
  try {
    const { search, sport, limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    const conditions = [`o.status = 'published'`];
    const params = [];
    let idx = 1;
    if (search) { conditions.push(`(o.title ILIKE $${idx} OR o.description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (sport) { conditions.push(`o.sport ILIKE $${idx}`); params.push(sport); idx++; }
    const where = 'WHERE ' + conditions.join(' AND ');
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM opportunities o ${where}`, params);
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT * FROM opportunities o ${where} ORDER BY o.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );
    const data = await Promise.all(rows.map(async (opp) => ({ ...opp, ...(await getPosterId(opp.posted_by_type, opp.posted_by_id)) })));
    return res.json({ data, total: countRes.rows[0].total, limit: lim, offset: off });
  } catch (err) {
    logger.error('GET /api/opportunities', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch opportunities.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM opportunities WHERE id = $1 AND status = 'published'", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Opportunity not found.' });
    const opp = { ...rows[0], ...(await getPosterId(rows[0].posted_by_type, rows[0].posted_by_id)) };
    return res.json({ opportunity: opp });
  } catch (err) {
    logger.error('GET /api/opportunities/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch opportunity.' });
  }
});

router.post('/', requireAuth, [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
], handleValidation, async (req, res) => {
  try {
    const { title, description, sport, location, budget, deadline } = req.body;
    const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    const { rows } = await pool.query(
      'INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.userType, posterId, title, description, sport || null, location || null, budget || null, deadline || null]
    );
    return res.status(201).json({ opportunity: rows[0] });
  } catch (err) {
    logger.error('POST /api/opportunities', { message: err.message });
    return res.status(500).json({ error: 'Failed to create opportunity.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found.' });
    const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    if (rows[0].posted_by_type !== req.userType || rows[0].posted_by_id !== posterId) return res.status(403).json({ error: 'Not your opportunity.' });
    const { title, description, sport, location, budget, deadline, status } = req.body;
    const { rows: updated } = await pool.query(
      'UPDATE opportunities SET title=COALESCE($1,title), description=COALESCE($2,description), sport=COALESCE($3,sport), location=COALESCE($4,location), budget=COALESCE($5,budget), deadline=COALESCE($6,deadline), status=COALESCE($7,status), updated_at=NOW() WHERE id=$8 RETURNING *',
      [title || null, description || null, sport || null, location || null, budget || null, deadline || null, status || null, req.params.id]
    );
    return res.json({ opportunity: updated[0] });
  } catch (err) {
    logger.error('PUT /api/opportunities/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to update opportunity.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM opportunities WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found.' });
    const posterId = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    if (rows[0].posted_by_type !== req.userType || rows[0].posted_by_id !== posterId) return res.status(403).json({ error: 'Not your opportunity.' });
    await pool.query("UPDATE opportunities SET status = 'deleted' WHERE id = $1", [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    logger.error('DELETE /api/opportunities/:id', { message: err.message });
    return res.status(500).json({ error: 'Failed to delete opportunity.' });
  }
});

module.exports = router;
