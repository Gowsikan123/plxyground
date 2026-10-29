'use strict';
const sql = require('../db/client');
const logger = require('../logger');

/**
 * Creates an in-app notification. Never throws: a failed notification must not
 * fail the action that triggered it (an application, a message, a decision).
 * recipient_id is creators.id for creators and businesses.id for brands.
 */
async function notify({ recipientType, recipientId, type, title, body = null, referenceType = null, referenceId = null }) {
  try {
    await sql`
      INSERT INTO notifications (recipient_type, recipient_id, type, title, body, reference_type, reference_id)
      VALUES (${recipientType}, ${recipientId}, ${type}, ${title}, ${body}, ${referenceType}, ${referenceId})`;
  } catch (err) {
    logger.error(`notify failed: ${err.message}`);
  }
}

module.exports = { notify };
