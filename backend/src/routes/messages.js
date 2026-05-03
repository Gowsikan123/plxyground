'use strict';
const express = require('express');
const { body } = require('express-validator');
const db = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

// GET /api/messages/threads
router.get('/threads', requireAuth, (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const rows = db
      .prepare(
        `SELECT * FROM message_threads
         WHERE (participant_a_type = ? AND participant_a_id = ?)
            OR (participant_b_type = ? AND participant_b_id = ?)
         ORDER BY last_message_at DESC`
      )
      .all(type, id, type, id);
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('GET /api/messages/threads', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch threads.' });
  }
});

// POST /api/messages/threads
router.post(
  '/threads',
  requireAuth,
  [
    body('recipient_type').isIn(['creator', 'business']).withMessage('Invalid recipient type.'),
    body('recipient_id').isInt().withMessage('Recipient ID must be integer.'),
  ],
  validationErrorHandler,
  (req, res) => {
    try {
      const { recipient_type, recipient_id } = req.body;
      const senderType = req.userType;
      const senderId = senderType === 'creator' ? req.user.creator_id : req.user.id;

      const existing = db
        .prepare(
          `SELECT * FROM message_threads WHERE
            (participant_a_type = ? AND participant_a_id = ? AND participant_b_type = ? AND participant_b_id = ?) OR
            (participant_a_type = ? AND participant_a_id = ? AND participant_b_type = ? AND participant_b_id = ?)`
        )
        .get(senderType, senderId, recipient_type, recipient_id, recipient_type, recipient_id, senderType, senderId);

      if (existing) return res.json({ success: true, data: existing });

      const row = db
        .prepare(
          'INSERT INTO message_threads (participant_a_type, participant_a_id, participant_b_type, participant_b_id) VALUES (?, ?, ?, ?)'
        )
        .run(senderType, senderId, recipient_type, recipient_id);

      const thread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(row.lastInsertRowid);
      return res.status(201).json({ success: true, data: thread });
    } catch (err) {
      logger.error('POST /api/messages/threads', { message: err.message });
      return res.status(500).json({ success: false, error: 'Failed to create thread.' });
    }
  }
);

// GET /api/messages/threads/:threadId
router.get('/threads/:threadId', requireAuth, (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const thread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(req.params.threadId);
    if (!thread) return res.status(404).json({ success: false, error: 'Thread not found.' });

    const isParticipant =
      (thread.participant_a_type === type && thread.participant_a_id === id) ||
      (thread.participant_b_type === type && thread.participant_b_id === id);
    if (!isParticipant) return res.status(403).json({ success: false, error: 'Not a participant.' });

    const lim = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    let rows;
    if (req.query.before) {
      rows = db
        .prepare('SELECT * FROM messages WHERE thread_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?')
        .all(req.params.threadId, req.query.before, lim);
    } else {
      rows = db
        .prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT ?')
        .all(req.params.threadId, lim);
    }
    return res.json({ success: true, data: rows.reverse() });
  } catch (err) {
    logger.error('GET /api/messages/threads/:threadId', { message: err.message });
    return res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
});

// POST /api/messages/threads/:threadId
router.post(
  '/threads/:threadId',
  requireAuth,
  [body('body').trim().notEmpty().withMessage('Message body required.')],
  validationErrorHandler,
  (req, res) => {
    try {
      const type = req.userType;
      const id = type === 'creator' ? req.user.creator_id : req.user.id;
      const thread = db.prepare('SELECT * FROM message_threads WHERE id = ?').get(req.params.threadId);
      if (!thread) return res.status(404).json({ success: false, error: 'Thread not found.' });

      const isParticipant =
        (thread.participant_a_type === type && thread.participant_a_id === id) ||
        (thread.participant_b_type === type && thread.participant_b_id === id);
      if (!isParticipant) return res.status(403).json({ success: false, error: 'Not a participant.' });

      const row = db
        .prepare('INSERT INTO messages (thread_id, sender_type, sender_id, body) VALUES (?, ?, ?, ?)')
        .run(req.params.threadId, type, id, req.body.body);

      db.prepare('UPDATE message_threads SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.threadId);

      const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(row.lastInsertRowid);
      return res.status(201).json({ success: true, data: msg });
    } catch (err) {
      logger.error('POST /api/messages/threads/:threadId', { message: err.message });
      return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
  }
);

module.exports = router;
