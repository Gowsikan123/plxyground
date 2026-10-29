'use strict';
const express = require('express');
const { body } = require('express-validator');
const sql = require('../db/client');
const { requireAuth, requireAuthEvenIfSuspended } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const { actorOf } = require('../utils/blocks');
const { deleteAccount } = require('../utils/deleteAccount');
const audit = require('../utils/auditLogger');
const logger = require('../logger');
const bcrypt = require('bcryptjs');

const router = express.Router();

const REPORT_TARGETS = ['creator', 'business', 'content', 'opportunity', 'message'];
const REASONS = ['spam', 'harassment', 'inappropriate', 'scam', 'impersonation', 'other'];
const PEOPLE = ['creator', 'business'];

// Checks the thing being reported exists, so the admin queue has no dead links.
async function targetExists(type, id) {
  const lookups = {
    creator: () => sql`SELECT 1 FROM creators WHERE id = ${id}`,
    business: () => sql`SELECT 1 FROM businesses WHERE id = ${id}`,
    content: () => sql`SELECT 1 FROM content WHERE id = ${id}`,
    opportunity: () => sql`SELECT 1 FROM opportunities WHERE id = ${id}`,
    message: () => sql`SELECT 1 FROM messages WHERE id = ${id}`,
  };
  const rows = await lookups[type]();
  return rows.length > 0;
}

// POST /api/safety/reports  { target_type, target_id, reason, details? }
router.post(
  '/reports',
  requireAuth,
  [
    body('target_type').isIn(REPORT_TARGETS).withMessage('Invalid report target.'),
    body('target_id').isInt({ min: 1 }).withMessage('Invalid target id.'),
    body('reason').isIn(REASONS).withMessage('Pick a reason.'),
    body('details').optional({ values: 'falsy' }).isString().isLength({ max: 1000 }).withMessage('Keep details under 1000 characters.'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      if (!PEOPLE.includes(req.userType)) return res.status(403).json({ success: false, error: 'Only app users can report.' });
      const reporter = actorOf(req);
      const targetType = req.body.target_type;
      const targetId = parseInt(req.body.target_id, 10);
      if (targetType === reporter.type && targetId === reporter.id) {
        return res.status(400).json({ success: false, error: 'You cannot report yourself.' });
      }
      if (!(await targetExists(targetType, targetId))) {
        return res.status(404).json({ success: false, error: 'That no longer exists.' });
      }
      // One open report per person per target is enough; repeats just return the existing one.
      const [existing] = await sql`
        SELECT id FROM reports
        WHERE reporter_type = ${reporter.type} AND reporter_id = ${reporter.id}
          AND target_type = ${targetType} AND target_id = ${targetId} AND status = 'open'`;
      if (existing) return res.json({ success: true, data: { id: existing.id } });

      const [report] = await sql`
        INSERT INTO reports (reporter_type, reporter_id, target_type, target_id, reason, details)
        VALUES (${reporter.type}, ${reporter.id}, ${targetType}, ${targetId}, ${req.body.reason}, ${req.body.details || null})
        RETURNING id`;
      return res.status(201).json({ success: true, data: { id: report.id } });
    } catch (err) {
      logger.error(`POST /api/safety/reports: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Could not send the report.' });
    }
  }
);

// GET /api/safety/blocks — people I have blocked
router.get('/blocks', requireAuth, async (req, res) => {
  try {
    const me = actorOf(req);
    const rows = await sql`
      SELECT bl.blocked_type, bl.blocked_id, bl.created_at,
             COALESCE(c.display_name, b.company_name) AS name,
             COALESCE(c.avatar_url, b.logo_url)       AS avatar_url
      FROM blocks bl
      LEFT JOIN creators   c ON bl.blocked_type = 'creator'  AND c.id = bl.blocked_id
      LEFT JOIN businesses b ON bl.blocked_type = 'business' AND b.id = bl.blocked_id
      WHERE bl.blocker_type = ${me.type} AND bl.blocker_id = ${me.id}
      ORDER BY bl.created_at DESC`;
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error(`GET /api/safety/blocks: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Could not load blocked accounts.' });
  }
});

// POST /api/safety/blocks  { blocked_type, blocked_id }
router.post(
  '/blocks',
  requireAuth,
  [
    body('blocked_type').isIn(PEOPLE).withMessage('Invalid account type.'),
    body('blocked_id').isInt({ min: 1 }).withMessage('Invalid account id.'),
  ],
  validationErrorHandler,
  async (req, res) => {
    try {
      if (!PEOPLE.includes(req.userType)) return res.status(403).json({ success: false, error: 'Only app users can block.' });
      const me = actorOf(req);
      const type = req.body.blocked_type;
      const id = parseInt(req.body.blocked_id, 10);
      if (type === me.type && id === me.id) return res.status(400).json({ success: false, error: 'You cannot block yourself.' });
      if (!(await targetExists(type, id))) return res.status(404).json({ success: false, error: 'That account no longer exists.' });
      await sql`
        INSERT INTO blocks (blocker_type, blocker_id, blocked_type, blocked_id)
        VALUES (${me.type}, ${me.id}, ${type}, ${id})
        ON CONFLICT DO NOTHING`;
      return res.status(201).json({ success: true });
    } catch (err) {
      logger.error(`POST /api/safety/blocks: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Could not block that account.' });
    }
  }
);

// DELETE /api/safety/blocks/:type/:id — unblock
router.delete('/blocks/:type/:id', requireAuth, async (req, res) => {
  try {
    const me = actorOf(req);
    if (!PEOPLE.includes(req.params.type)) return res.status(400).json({ success: false, error: 'Invalid account type.' });
    await sql`
      DELETE FROM blocks
      WHERE blocker_type = ${me.type} AND blocker_id = ${me.id}
        AND blocked_type = ${req.params.type} AND blocked_id = ${parseInt(req.params.id, 10)}`;
    return res.json({ success: true });
  } catch (err) {
    logger.error(`DELETE /api/safety/blocks: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Could not unblock that account.' });
  }
});

// POST /api/safety/delete-account  { password }
// Permanently deletes the signed-in account and everything it owns. A POST with
// the password (rather than a bare DELETE) so a stolen token alone can't do it.
router.post(
  '/delete-account',
  requireAuthEvenIfSuspended,
  [body('password').isString().notEmpty().withMessage('Enter your password to confirm.')],
  validationErrorHandler,
  async (req, res) => {
    try {
      if (!PEOPLE.includes(req.userType)) return res.status(403).json({ success: false, error: 'Admins are managed separately.' });
      const valid = await bcrypt.compare(req.body.password, req.user.password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'That password is not right.' });

      const me = actorOf(req);
      await deleteAccount(me);
      await audit.log({
        actor_type: me.type, actor_id: me.id, action: 'ACCOUNT_DELETED',
        target_type: me.type, target_id: me.id, ip_address: req.ip,
      });
      return res.json({ success: true });
    } catch (err) {
      logger.error(`POST /api/safety/delete-account: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Could not delete the account. Try again.' });
    }
  }
);

module.exports = router;
