'use strict';
const express = require('express');
const { body } = require('express-validator');
const sql = require('../db/client');
const { requireAuth } = require('../middleware/auth');
const { validationErrorHandler } = require('../middleware/validate');
const logger = require('../logger');
const { isBlockedBetween } = require('../utils/blocks');

const BLOCKED = 'You can no longer message this account.';

const router = express.Router();

function me(req) {
  return { type: req.userType, id: req.userType === 'creator' ? req.user.creator_id : req.user.id };
}

// Returns the thread if the current user is in it; otherwise sends 404/403 and returns null.
async function loadThreadFor(req, res) {
  const { type, id } = me(req);
  const [thread] = await sql`SELECT * FROM message_threads WHERE id = ${parseInt(req.params.threadId, 10)}`;
  if (!thread) {
    res.status(404).json({ success: false, error: 'Thread not found.' });
    return null;
  }
  const isParticipant =
    (thread.participant_a_type === type && thread.participant_a_id === id) ||
    (thread.participant_b_type === type && thread.participant_b_id === id);
  if (!isParticipant) {
    res.status(403).json({ success: false, error: 'Not a participant.' });
    return null;
  }
  return thread;
}

// GET /api/messages/threads — my conversations, newest first, with the other
// person's name and avatar, the last message and how many are unread.
router.get('/threads', requireAuth, async (req, res) => {
  try {
    const { type, id } = me(req);
    const rows = await sql`
      WITH mine AS (
        SELECT t.*,
          CASE WHEN t.participant_a_type = ${type} AND t.participant_a_id = ${id}
               THEN t.participant_b_type ELSE t.participant_a_type END AS other_type,
          CASE WHEN t.participant_a_type = ${type} AND t.participant_a_id = ${id}
               THEN t.participant_b_id ELSE t.participant_a_id END AS other_id
        FROM message_threads t
        WHERE (t.participant_a_type = ${type} AND t.participant_a_id = ${id})
           OR (t.participant_b_type = ${type} AND t.participant_b_id = ${id})
      )
      SELECT m.id, m.other_type, m.other_id, m.last_message_at, m.created_at,
             COALESCE(c.display_name, b.company_name) AS other_name,
             COALESCE(c.avatar_url, b.logo_url)       AS other_avatar,
             (SELECT body FROM messages WHERE thread_id = m.id ORDER BY created_at DESC LIMIT 1) AS last_message,
             (SELECT COUNT(*)::int FROM messages
               WHERE thread_id = m.id AND is_read = FALSE
                 AND NOT (sender_type = ${type} AND sender_id = ${id})) AS unread_count
      FROM mine m
      LEFT JOIN blocks bl ON
           (bl.blocker_type = ${type} AND bl.blocker_id = ${id} AND bl.blocked_type = m.other_type AND bl.blocked_id = m.other_id)
        OR (bl.blocked_type = ${type} AND bl.blocked_id = ${id} AND bl.blocker_type = m.other_type AND bl.blocker_id = m.other_id)
      LEFT JOIN creators   c ON m.other_type = 'creator'  AND c.id = m.other_id
      LEFT JOIN businesses b ON m.other_type = 'business' AND b.id = m.other_id
      WHERE bl.blocker_id IS NULL
      ORDER BY COALESCE(m.last_message_at, m.created_at) DESC`;
    return res.json({ success: true, data: rows });
  } catch (err) {
    logger.error(`GET /api/messages/threads: ${err.message}`);
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
  async (req, res) => {
    try {
      const { type, id } = me(req);
      const recipientType = req.body.recipient_type;
      const recipientId = parseInt(req.body.recipient_id, 10);
      if (recipientType === type && recipientId === id) {
        return res.status(400).json({ success: false, error: 'You cannot message yourself.' });
      }
      const recipient = recipientType === 'creator'
        ? await sql`SELECT id FROM creators WHERE id = ${recipientId}`
        : await sql`SELECT id FROM businesses WHERE id = ${recipientId}`;
      if (!recipient.length) return res.status(404).json({ success: false, error: 'That account no longer exists.' });
      if (await isBlockedBetween({ type, id }, { type: recipientType, id: recipientId })) {
        return res.status(403).json({ success: false, error: BLOCKED });
      }

      const [existing] = await sql`
        SELECT * FROM message_threads WHERE
          (participant_a_type = ${type} AND participant_a_id = ${id}
           AND participant_b_type = ${recipientType} AND participant_b_id = ${recipientId})
       OR (participant_a_type = ${recipientType} AND participant_a_id = ${recipientId}
           AND participant_b_type = ${type} AND participant_b_id = ${id})`;
      if (existing) return res.json({ success: true, data: existing });

      const [thread] = await sql`
        INSERT INTO message_threads (participant_a_type, participant_a_id, participant_b_type, participant_b_id)
        VALUES (${type}, ${id}, ${recipientType}, ${recipientId})
        RETURNING *`;
      return res.status(201).json({ success: true, data: thread });
    } catch (err) {
      logger.error(`POST /api/messages/threads: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Failed to create thread.' });
    }
  }
);

// GET /api/messages/threads/:threadId?before=<ISO date>&limit=
router.get('/threads/:threadId', requireAuth, async (req, res) => {
  try {
    const thread = await loadThreadFor(req, res);
    if (!thread) return undefined;

    const { type, id } = me(req);
    await sql`
      UPDATE messages SET is_read = TRUE
      WHERE thread_id = ${thread.id} AND is_read = FALSE AND NOT (sender_type = ${type} AND sender_id = ${id})`;

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const rows = req.query.before
      ? await sql`
          SELECT * FROM messages WHERE thread_id = ${thread.id} AND created_at < ${req.query.before}
          ORDER BY created_at DESC LIMIT ${limit}`
      : await sql`
          SELECT * FROM messages WHERE thread_id = ${thread.id}
          ORDER BY created_at DESC LIMIT ${limit}`;
    return res.json({ success: true, data: rows.reverse() });
  } catch (err) {
    logger.error(`GET /api/messages/threads/:threadId: ${err.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
});

// POST /api/messages/threads/:threadId
router.post(
  '/threads/:threadId',
  requireAuth,
  [body('body').trim().notEmpty().withMessage('Message body required.')],
  validationErrorHandler,
  async (req, res) => {
    try {
      const thread = await loadThreadFor(req, res);
      if (!thread) return undefined;
      const { type, id } = me(req);
      const other = thread.participant_a_type === type && thread.participant_a_id === id
        ? { type: thread.participant_b_type, id: thread.participant_b_id }
        : { type: thread.participant_a_type, id: thread.participant_a_id };
      if (await isBlockedBetween({ type, id }, other)) {
        return res.status(403).json({ success: false, error: BLOCKED });
      }

      const [msg] = await sql`
        INSERT INTO messages (thread_id, sender_type, sender_id, body)
        VALUES (${thread.id}, ${type}, ${id}, ${req.body.body})
        RETURNING *`;
      await sql`UPDATE message_threads SET last_message_at = NOW() WHERE id = ${thread.id}`;
      return res.status(201).json({ success: true, data: msg });
    } catch (err) {
      logger.error(`POST /api/messages/threads/:threadId: ${err.message}`);
      return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
  }
);

module.exports = router;
