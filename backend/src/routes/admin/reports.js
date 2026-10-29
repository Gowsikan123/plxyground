'use strict';
const express = require('express');
const { body } = require('express-validator');
const sql = require('../../db/client');
const audit = require('../../utils/auditLogger');
const logger = require('../../logger');
const { requireAdmin } = require('../../middleware/auth');
const { validationErrorHandler } = require('../../middleware/validate');

const router = express.Router();

// GET /api/admin/reports?status=open|actioned|dismissed|all&limit=&offset=
// Each report comes with who filed it and a readable label for what was reported.
router.get('/', requireAdmin, async (req, res) => {
  try {
    const status = ['open', 'actioned', 'dismissed'].includes(req.query.status) ? req.query.status : req.query.status === 'all' ? null : 'open';
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const rows = await sql`
      SELECT r.*,
        COALESCE(rc.display_name, rb.company_name) AS reporter_name,
        CASE r.target_type
          WHEN 'creator'     THEN (SELECT display_name FROM creators WHERE id = r.target_id)
          WHEN 'business'    THEN (SELECT company_name FROM businesses WHERE id = r.target_id)
          WHEN 'content'     THEN (SELECT title FROM content WHERE id = r.target_id)
          WHEN 'opportunity' THEN (SELECT title FROM opportunities WHERE id = r.target_id)
          WHEN 'message'     THEN (SELECT LEFT(body, 140) FROM messages WHERE id = r.target_id)
        END AS target_label,
        (SELECT COUNT(*)::int FROM reports r2
          WHERE r2.target_type = r.target_type AND r2.target_id = r.target_id) AS times_reported
      FROM reports r
      LEFT JOIN creators   rc ON r.reporter_type = 'creator'  AND rc.id = r.reporter_id
      LEFT JOIN businesses rb ON r.reporter_type = 'business' AND rb.id = r.reporter_id
      WHERE (${status}::text IS NULL OR r.status = ${status})
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`;
    const [{ open }] = await sql`SELECT COUNT(*)::int AS open FROM reports WHERE status = 'open'`;
    return res.json({ success: true, data: rows, open });
  } catch (err) {
    logger.error(`GET /api/admin/reports: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to load reports.' });
  }
});

// PUT /api/admin/reports/:id  { status: 'actioned' | 'dismissed' }
router.put(
  '/:id',
  requireAdmin,
  [body('status').isIn(['actioned', 'dismissed']).withMessage('Status must be actioned or dismissed.')],
  validationErrorHandler,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const [report] = await sql`
        UPDATE reports SET status = ${req.body.status}, reviewed_by = ${req.admin.id}, reviewed_at = NOW()
        WHERE id = ${id} RETURNING *`;
      if (!report) return res.status(404).json({ success: false, error: 'Report not found.' });
      await audit.log({
        actor_type: 'admin', actor_id: req.admin.id, action: `REPORT_${req.body.status.toUpperCase()}`,
        target_type: 'report', target_id: id, ip_address: req.ip,
      });
      return res.json({ success: true, data: report });
    } catch (err) {
      logger.error(`PUT /api/admin/reports/:id: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Failed to update report.' });
    }
  }
);

module.exports = router;
