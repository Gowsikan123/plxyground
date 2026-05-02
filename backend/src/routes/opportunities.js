'use strict';
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

async function getPosterInfo(posted_by_type, posted_by_id) {
  if (posted_by_type === 'creator') {
    const { rows } = await pool.query(
      'SELECT display_name AS name, slug FROM creators WHERE id = $1',
      [posted_by_id]
    );
    return rows[0] || null;
  } else {
    const { rows } = await pool.query(
      'SELECT company_name AS name, slug FROM businesses WHERE id = $1',
      [posted_by_id]
    );
    return rows[0] || null;
  }
}

router.get('/', async (req, res) => {
  try {
    const { search, sport, limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    const params = ["published"];
    const conditions = ['status = $1'];
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    if (sport) {
      params.push(sport);
      conditions.push(`sport = $${params.length}`);
    }
    const where = 'WHERE ' + conditions.join(' AND ');
    params.push(lim, off);
    const [dataRes, countRes] = await Promise.all([
      pool.query(`SELECT * FROM opportunities ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params),
      pool.query(`SELECT COUNT(*) FROM opportunities ${where}`, params.slice(0, -2)),
    ]);
    const data = await Promise.all(
      dataRes.rows.map(async (opp) => ({
        ...opp,
        poster: await getPosterInfo(opp.posted_by_type, opp.posted_by_id),
      }))
    );
    return res.json({ data, total: parseInt(countRes.rows[0].count, 10), limit: lim, offset: off });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM opportunities WHERE id = $1 AND status = 'published'", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Opportunity not found.' });
    const opp = rows[0];
    const poster = await getPosterInfo(opp.posted_by_type, opp.posted_by_id);
    return res.json({ opportunity: { ...opp, poster } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title is required.'),
    body('description').notEmpty().withMessage('Description is required.'),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, sport, location, budget, deadline } = req.body;
      const posted_by_id = req.userType === 'creator' ? req.user.creator_id : req.user.id;
      const { rows } = await pool.query(
        `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.userType, posted_by_id, title, description, sport || null, location || null, budget || null, deadline || null]
      );
      return res.status(201).json({ opportunity: rows[0] });
    } catch (err) {
      return res.status(500).json({ error: 'Server error.' });
    }
  }
);

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const posted_by_id = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    const { rows: existing } = await pool.query(
      'SELECT * FROM opportunities WHERE id = $1 AND posted_by_type = $2 AND posted_by_id = $3',
      [req.params.id, req.userType, posted_by_id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'Opportunity not found or not yours.' });
    const { title, description, sport, location, budget, deadline, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE opportunities SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        sport = COALESCE($3, sport), location = COALESCE($4, location),
        budget = COALESCE($5, budget), deadline = COALESCE($6, deadline),
        status = COALESCE($7, status), updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title || null, description || null, sport || null, location || null, budget || null, deadline || null, status || null, req.params.id]
    );
    return res.json({ opportunity: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const posted_by_id = req.userType === 'creator' ? req.user.creator_id : req.user.id;
    const { rows } = await pool.query(
      'SELECT id FROM opportunities WHERE id = $1 AND posted_by_type = $2 AND posted_by_id = $3',
      [req.params.id, req.userType, posted_by_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Opportunity not found or not yours.' });
    await pool.query("UPDATE opportunities SET status = 'deleted' WHERE id = $1", [req.params.id]);
    return res.json({ message: 'Opportunity deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
