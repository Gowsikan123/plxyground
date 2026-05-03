'use strict';
const express = require('express');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

// GET /api/notifications
router.get('/', requireAuth, (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const lim = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const off = parseInt(req.query.offset, 10) || 0;
    const rows = db
      .prepare(
        'SELECT * FROM notifications WHERE recipient_type = ? AND recipient_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(type, id, lim, off);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('GET /api/notifications', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications.' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const result = db
      .prepare(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_type = ? AND recipient_id = ?'
      )
      .run(req.params.id, type, id);
    if (result.changes === 0)
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    return res.json({ success: true });
  } catch (err) {
    logger.error('PUT /api/notifications/:id/read', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to mark as read.' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE recipient_type = ? AND recipient_id = ? AND is_read = 0'
    ).run(type, id);
    return res.json({ success: true });
  } catch (err) {
    logger.error('PUT /api/notifications/read-all', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to mark all as read.' });
  }
});

module.exports = router;
