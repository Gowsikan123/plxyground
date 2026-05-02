'use strict';
const express = require('express');
const { body } = require('express-validator');
const pool = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const logger = require('../logger');

const router = express.Router();

router.get('/threads', requireAuth, async (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const { rows } = await pool.query(
      `SELECT mt.*, 
         CASE WHEN mt.participant_a_type = $1 AND mt.participant_a_id = $2 THEN mt.participant_b_type ELSE mt.participant_a_type END AS other_type,
         CASE WHEN mt.participant_a_type = $1 AND mt.participant_a_id = $2 THEN mt.participant_b_id ELSE mt.participant_a_id END AS other_id
       FROM message_threads mt
       WHERE (mt.participant_a_type = $1 AND mt.participant_a_id = $2) OR (mt.participant_b_type = $1 AND mt.participant_b_id = $2)
       ORDER BY mt.last_message_at DESC NULLS LAST`,
      [type, id]
    );
    return res.json({ data: rows });
  } catch (err) {
    logger.error('GET /api/messages/threads', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch threads.' });
  }
});

router.post('/threads', requireAuth, [
  body('recipient_type').isIn(['creator', 'business']).withMessage('Invalid recipient type.'),
  body('recipient_id').isInt().withMessage('Recipient ID must be integer.'),
], handleValidation, async (req, res) => {
  try {
    const { recipient_type, recipient_id } = req.body;
    const senderType = req.userType;
    const senderId = senderType === 'creator' ? req.user.creator_id : req.user.id;
    const existing = await pool.query(
      `SELECT * FROM message_threads WHERE
        (participant_a_type = $1 AND participant_a_id = $2 AND participant_b_type = $3 AND participant_b_id = $4) OR
        (participant_a_type = $3 AND participant_a_id = $4 AND participant_b_type = $1 AND participant_b_id = $2)`,
      [senderType, senderId, recipient_type, recipient_id]
    );
    if (existing.rows.length > 0) return res.json({ thread: existing.rows[0] });
    const { rows } = await pool.query(
      'INSERT INTO message_threads (participant_a_type, participant_a_id, participant_b_type, participant_b_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [senderType, senderId, recipient_type, recipient_id]
    );
    return res.status(201).json({ thread: rows[0] });
  } catch (err) {
    logger.error('POST /api/messages/threads', { message: err.message });
    return res.status(500).json({ error: 'Failed to create thread.' });
  }
});

router.get('/threads/:threadId', requireAuth, async (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const { rows: thread } = await pool.query(
      'SELECT * FROM message_threads WHERE id = $1',
      [req.params.threadId]
    );
    if (!thread[0]) return res.status(404).json({ error: 'Thread not found.' });
    const t = thread[0];
    const isParticipant = (t.participant_a_type === type && t.participant_a_id === id) || (t.participant_b_type === type && t.participant_b_id === id);
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant.' });
    const { limit = 50, before } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 50, 100);
    const params = [req.params.threadId, lim];
    let extra = '';
    if (before) { extra = ' AND m.created_at < $3'; params.push(before); }
    const { rows } = await pool.query(
      `SELECT * FROM messages m WHERE m.thread_id = $1 ${extra} ORDER BY m.created_at DESC LIMIT $2`,
      params
    );
    return res.json({ data: rows.reverse() });
  } catch (err) {
    logger.error('GET /api/messages/threads/:threadId', { message: err.message });
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

router.post('/threads/:threadId', requireAuth, [
  body('body').trim().notEmpty().withMessage('Message body required.'),
], handleValidation, async (req, res) => {
  try {
    const type = req.userType;
    const id = type === 'creator' ? req.user.creator_id : req.user.id;
    const { rows: thread } = await pool.query('SELECT * FROM message_threads WHERE id = $1', [req.params.threadId]);
    if (!thread[0]) return res.status(404).json({ error: 'Thread not found.' });
    const t = thread[0];
    const isParticipant = (t.participant_a_type === type && t.participant_a_id === id) || (t.participant_b_type === type && t.participant_b_id === id);
    if (!isParticipant) return res.status(403).json({ error: 'Not a participant.' });
    const { rows } = await pool.query(
      'INSERT INTO messages (thread_id, sender_type, sender_id, body) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.threadId, type, id, req.body.body]
    );
    await pool.query('UPDATE message_threads SET last_message_at = NOW() WHERE id = $1', [req.params.threadId]);
    return res.status(201).json({ message: rows[0] });
  } catch (err) {
    logger.error('POST /api/messages/threads/:threadId', { message: err.message });
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

module.exports = router;
