'use strict';
const express = require('express');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const logger = require('../logger');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE recipient_type = $1 AND recipient_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      [type, id, lim, off]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/notifications', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const { rows } = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_type = $2 AND recipient_id = $3 RETURNING id',
      [req.params.id, type, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Notification not found.' });
    return res.json({ success: true });
  } catch (err) {
    logger.error('PUT /api/notifications/:id/read', { message: err.message });
    return res.status(500).json({ error: 'Failed to mark as read.' });
  }
});

router.put('/read-all', requireAuth, async (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE recipient_type = $1 AND recipient_id = $2 AND is_read = FALSE',
      [type, id]
    );
    return res.json({ success: true });
  } catch (err) {
    logger.error('PUT /api/notifications/read-all', { message: err.message });
    return res.status(500).json({ error: 'Failed to mark all as read.' });
  }
});

module.exports = router;
