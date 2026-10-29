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
