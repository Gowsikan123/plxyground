'use strict';
const express = require('express');
const sql = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

function recipient(req) {
  return { type: req.userType, id: req.userType === 'creator' ? req.user.creator_id : req.user.id };
}

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const { type, id } = recipient(req);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const rows = await sql`
      SELECT * FROM notifications
      WHERE recipient_type = ${type} AND recipient_id = ${id}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error(`GET /api/notifications: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications.' });
  }
});

// GET /api/notifications/unread — badge counts for notifications and messages
router.get('/unread', requireAuth, async (req, res) => {
  try {
    const { type, id } = recipient(req);
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM notifications
          WHERE recipient_type = ${type} AND recipient_id = ${id} AND is_read = FALSE) AS notifications,
        (SELECT COUNT(*)::int FROM messages m
          JOIN message_threads t ON t.id = m.thread_id
          WHERE m.is_read = FALSE
            AND NOT (m.sender_type = ${type} AND m.sender_id = ${id})
            AND ((t.participant_a_type = ${type} AND t.participant_a_id = ${id})
              OR (t.participant_b_type = ${type} AND t.participant_b_id = ${id}))) AS messages`;
    return res.json({ success: true, data: counts });
  } catch (err) {
    logger.error(`GET /api/notifications/unread: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch counts.' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    const { type, id } = recipient(req);
    await sql`
      UPDATE notifications SET is_read = TRUE
      WHERE recipient_type = ${type} AND recipient_id = ${id} AND is_read = FALSE`;
    return res.json({ success: true });
  } catch (err) {
    logger.error(`PUT /api/notifications/read-all: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to mark all as read.' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const { type, id } = recipient(req);
    const updated = await sql`
      UPDATE notifications SET is_read = TRUE
      WHERE id = ${parseInt(req.params.id, 10)} AND recipient_type = ${type} AND recipient_id = ${id}
      RETURNING id`;
    if (!updated.length) return res.status(404).json({ success: false, error: 'Notification not found.' });
    return res.json({ success: true });
  } catch (err) {
    logger.error(`PUT /api/notifications/:id/read: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to mark as read.' });
  }
});

module.exports = router;
