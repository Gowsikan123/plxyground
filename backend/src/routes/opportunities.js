'use strict';
const express = require('express');
const { body, query } = require('express-validator');
const pool = require('../db/client');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const audit = require('../utils/auditLogger');

const router = express.Router();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('sport').optional().trim(),
    query('type').optional().isIn(['creator', 'business']),
  ],
  validate,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;
      const sport = req.query.sport || null;
      const type = req.query.type || null;

      const conditions = ["o.status='published'"];
      const params = [];
      let idx = 1;

      if (sport) { conditions.push(`o.sport ILIKE $${idx++}`); params.push(`%${sport}%`); }
      if (type) { conditions.push(`o.posted_by_type=$${idx++}`); params.push(type); }

      const where = conditions.join(' AND ');
      const countRes = await pool.query(`SELECT COUNT(*) FROM opportunities o WHERE ${where}`, params);
      const total = parseInt(countRes.rows[0].count, 10);

      params.push(limit, offset);
      const result = await pool.query(`SELECT o.* FROM opportunities o WHERE ${where} ORDER BY o.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, params);

      const enriched = await Promise.all(result.rows.map(async (opp) => {
        if (opp.posted_by_type === 'business') {
          const b = await pool.query('SELECT company_name, slug, logo_url FROM businesses WHERE id=$1', [opp.posted_by_id]);
          return { ...opp, poster: b.rows[0] || null };
        } else {
          const c = await pool.query('SELECT display_name, username, slug, avatar_url FROM creators WHERE id=$1', [opp.posted_by_id]);
          return { ...opp, poster: c.rows[0] || null };
        }
      }));

      return res.json({ data: enriched, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch {
      return res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const result = await pool.query("SELECT * FROM opportunities WHERE id=$1 AND status='published'", [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Opportunity not found' });
    const opp = result.rows[0];
    let poster = null;
    if (opp.posted_by_type === 'business') {
      const b = await pool.query('SELECT id, company_name, slug, logo_url, bio, location FROM businesses WHERE id=$1', [opp.posted_by_id]);
      poster = b.rows[0] || null;
    } else {
      const c = await pool.query('SELECT id, display_name, username, slug, avatar_url, bio, sport, location FROM creators WHERE id=$1', [opp.posted_by_id]);
      poster = c.rows[0] || null;
    }
    return res.json({ ...opp, poster });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').trim().isLength({ min: 10, max: 200 }),
    body('description').trim().isLength({ min: 30 }),
    body('sport').optional().trim(),
    body('location').optional().trim(),
    body('budget').optional().trim(),
    body('deadline').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, sport, location, budget, deadline } = req.body;
      const posterId = req.userType === 'business' ? req.user.id : req.user.creator_id;
      const result = await pool.query(
        'INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
        [req.userType, posterId, title, description, sport || null, location || null, budget || null, deadline || null]
      );
      await audit.log({ actor_type: req.userType, actor_id: posterId, action: 'CREATE_OPPORTUNITY', target_id: result.rows[0].id, ip_address: req.ip });
      return res.status(201).json(result.rows[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to create opportunity' });
    }
  }
);

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const posterId = req.userType === 'business' ? req.user.id : req.user.creator_id;
    const result = await pool.query('SELECT * FROM opportunities WHERE id=$1 AND posted_by_type=$2 AND posted_by_id=$3', [id, req.userType, posterId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Opportunity not found or not yours' });
    await pool.query("UPDATE opportunities SET status='deleted' WHERE id=$1", [id]);
    return res.json({ message: 'Opportunity removed' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

module.exports = router;
