'use strict';
const sql = require('../db/client');
const logger = require('../logger');

async function log({ actor_type, actor_id, action, target_type = null, target_id = null, ip_address = null, metadata = null }) {
  try {
    await sql`
      INSERT INTO audit_logs (actor_type, actor_id, action, target_type, target_id, ip_address, metadata)
      VALUES (${actor_type}, ${actor_id}, ${action}, ${target_type}, ${target_id}, ${ip_address}, ${metadata ? JSON.stringify(metadata) : null})`;
  } catch (err) {
    logger.error('Audit log failed:', err);
  }
}

module.exports = { log };
