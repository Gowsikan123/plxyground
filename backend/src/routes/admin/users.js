'use strict';

const router = require('express').Router();
const { param, body, validationResult } = require('express-validator');
const db = require('../../db/client');
const { requireAdmin } = require('../../middleware/auth');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');

// GET /api/admin/users/creators — list all creators
router.get('/creators', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || null;

    const params = [];
    let searchClause = '';
    if (search) {
      params.push(`%${search}%`);
      searchClause = `WHERE username ILIKE $1 OR display_name ILIKE $1 OR email ILIKE $1`;
    }
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT id, username, email, display_name, sport, slug,
              is_verified, is_suspended, follower_count, created_at
       FROM creators
       ${searchClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ creators: rows, limit, offset });
  } catch (err) {
    logger.error('Admin users creators error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/businesses — list all businesses
router.get('/businesses', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || null;

    const params = [];
    let searchClause = '';
    if (search) {
      params.push(`%${search}%`);
      searchClause = `WHERE business_name ILIKE $1 OR email ILIKE $1`;
    }
    params.push(limit, offset);

    const { rows } = await db.query(
      `SELECT id, business_name, email, industry, website,
              is_verified, is_suspended, created_at
       FROM businesses
       ${searchClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ businesses: rows, limit, offset });
  } catch (err) {
    logger.error('Admin users businesses error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/creators/:id/suspend — suspend creator
router.patch('/creators/:id/suspend', requireAdmin, param('id').isInt(), [
  body('reason').optional().trim().isLength({ max: 500 }),
], async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });

  try {
    const { rows } = await db.query(
      `UPDATE creators SET is_suspended = true, updated_at = NOW()
       WHERE id = $1 RETURNING id, username, is_suspended`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });

    audit(req.user.sub, 'admin', 'creator.suspend', { creator_id: req.params.id, reason: req.body.reason });
    logger.warn('Creator suspended', { admin_id: req.user.sub, creator_id: req.params.id });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('Creator suspend error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/creators/:id/reactivate — reactivate creator
router.patch('/creators/:id/reactivate', requireAdmin, param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });

  try {
    const { rows } = await db.query(
      `UPDATE creators SET is_suspended = false, updated_at = NOW()
       WHERE id = $1 RETURNING id, username, is_suspended`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });

    audit(req.user.sub, 'admin', 'creator.reactivate', { creator_id: req.params.id });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('Creator reactivate error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/creators/:id/verify — verify creator
router.patch('/creators/:id/verify', requireAdmin, param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });

  try {
    const { rows } = await db.query(
      `UPDATE creators SET is_verified = true, updated_at = NOW()
       WHERE id = $1 RETURNING id, username, is_verified`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });

    audit(req.user.sub, 'admin', 'creator.verify', { creator_id: req.params.id });
    return res.json({ creator: rows[0] });
  } catch (err) {
    logger.error('Creator verify error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/businesses/:id/suspend — suspend business
router.patch('/businesses/:id/suspend', requireAdmin, param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });

  try {
    const { rows } = await db.query(
      `UPDATE businesses SET is_suspended = true, updated_at = NOW()
       WHERE id = $1 RETURNING id, business_name, is_suspended`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Business not found' });

    audit(req.user.sub, 'admin', 'business.suspend', { business_id: req.params.id });
    return res.json({ business: rows[0] });
  } catch (err) {
    logger.error('Business suspend error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/businesses/:id/reactivate — reactivate business
router.patch('/businesses/:id/reactivate', requireAdmin, param('id').isInt(), async (req, res) => {
  if (!validationResult(req).isEmpty()) return res.status(422).json({ error: 'Invalid id' });

  try {
    const { rows } = await db.query(
      `UPDATE businesses SET is_suspended = false, updated_at = NOW()
       WHERE id = $1 RETURNING id, business_name, is_suspended`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Business not found' });

    audit(req.user.sub, 'admin', 'business.reactivate', { business_id: req.params.id });
    return res.json({ business: rows[0] });
  } catch (err) {
    logger.error('Business reactivate error', { message: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
