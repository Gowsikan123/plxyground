import { Router } from 'express';
import pool from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { auditLog } from '../utils/auditLogger.js';

const router = Router();

// GET /api/partners — list all published business partners
router.get('/', async (req, res) => {
  try {
    const { search = '', industry = '', limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit) || 20, 100);
    const off = parseInt(offset) || 0;

    let conditions = [`b.is_suspended = FALSE`];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(b.company_name ILIKE $${params.length} OR b.bio ILIKE $${params.length})`);
    }

    if (industry) {
      params.push(industry);
      conditions.push(`b.industry = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(lim, off);

    const { rows } = await pool.query(
      `SELECT b.id, b.company_name, b.slug, b.bio, b.logo_url, b.industry, b.website, b.location, b.created_at
       FROM businesses b
       ${where}
       ORDER BY b.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM businesses b ${where}`,
      countParams
    );

    res.json({ data: rows, total: parseInt(countRows[0].count), limit: lim, offset: off });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// GET /api/partners/:id — get single partner by id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, company_name, slug, bio, logo_url, industry, website, location, created_at
       FROM businesses WHERE id = $1 AND is_suspended = FALSE`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Partner not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch partner' });
  }
});

// GET /api/partners/slug/:slug — get single partner by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, company_name, slug, bio, logo_url, industry, website, location, created_at
       FROM businesses WHERE slug = $1 AND is_suspended = FALSE`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Partner not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch partner' });
  }
});

export default router;
