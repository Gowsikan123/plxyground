import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { auditLog } from '../utils/auditLogger.js';

const router = Router();

/**
 * Business plan routes — allows businesses to submit and manage
 * their partnership/sponsorship proposals to creators.
 */

// GET /api/business-plan — list all plans for authenticated business
router.get('/', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') {
      return res.status(403).json({ error: 'Only businesses can access business plans' });
    }
    const { rows } = await pool.query(
      `SELECT bc.id, bc.title, bc.body, bc.budget_range, bc.target_area, bc.status, bc.created_at, bc.updated_at
       FROM business_content bc
       WHERE bc.business_id = $1
       ORDER BY bc.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch business plans' });
  }
});

// POST /api/business-plan — create a new business plan/campaign
router.post(
  '/',
  requireAuth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('budget_range').optional().isString(),
    body('target_area').optional().isString(),
  ],
  async (req, res) => {
    try {
      if (req.userType !== 'business') {
        return res.status(403).json({ error: 'Only businesses can create business plans' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
      }

      const { title, body: planBody, budget_range, target_area } = req.body;

      const { rows } = await pool.query(
        `INSERT INTO business_content (business_id, title, body, budget_range, target_area, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [req.user.id, title, planBody || null, budget_range || null, target_area || null]
      );

      const created = rows[0];

      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id, status) VALUES ('business_content', $1, 'pending')`,
        [created.id]
      );

      await auditLog({
        actor_type: 'business',
        actor_id: req.user.id,
        action: 'BUSINESS_PLAN_CREATED',
        target_type: 'business_content',
        target_id: created.id,
        ip_address: req.ip,
      });

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create business plan' });
    }
  }
);

// PUT /api/business-plan/:id — update a business plan
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') {
      return res.status(403).json({ error: 'Only businesses can update business plans' });
    }

    const { rows: existing } = await pool.query(
      'SELECT * FROM business_content WHERE id = $1 AND business_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Plan not found or not owned by you' });

    const { title, body: planBody, budget_range, target_area } = req.body;
    const current = existing[0];

    const newTitle = title !== undefined ? title : current.title;
    const newBody = planBody !== undefined ? planBody : current.body;
    const newBudget = budget_range !== undefined ? budget_range : current.budget_range;
    const newTarget = target_area !== undefined ? target_area : current.target_area;

    const contentChanged = (title && title !== current.title) || (planBody && planBody !== current.body);
    const newStatus = contentChanged ? 'pending' : current.status;

    const { rows } = await pool.query(
      `UPDATE business_content SET title=$1, body=$2, budget_range=$3, target_area=$4, status=$5, updated_at=NOW()
       WHERE id=$6 AND business_id=$7 RETURNING *`,
      [newTitle, newBody, newBudget, newTarget, newStatus, req.params.id, req.user.id]
    );

    if (contentChanged) {
      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id, status) VALUES ('business_content', $1, 'pending')`,
        [rows[0].id]
      );
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update business plan' });
  }
});

// DELETE /api/business-plan/:id — soft delete
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.userType !== 'business') {
      return res.status(403).json({ error: 'Only businesses can delete business plans' });
    }
    const { rows } = await pool.query(
      `UPDATE business_content SET status='deleted', updated_at=NOW()
       WHERE id=$1 AND business_id=$2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Plan not found or not owned by you' });

    await auditLog({
      actor_type: 'business',
      actor_id: req.user.id,
      action: 'BUSINESS_PLAN_DELETED',
      target_type: 'business_content',
      target_id: parseInt(req.params.id),
      ip_address: req.ip,
    });

    res.json({ message: 'Plan deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete business plan' });
  }
});

export default router;
