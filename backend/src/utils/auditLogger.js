'use strict';
const pool = require('../db/client');
const logger = require('../logger');

async function log({ actor_type, actor_id, action, target_type, target_id, metadata, ip_address }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        actor_type,
        actor_id || null,
        action,
        target_type || null,
        target_id || null,
        metadata ? JSON.stringify(metadata) : null,
        ip_address || null,
      ]
    );
  } catch (err) {
    logger.error('Audit log write failed', err.message);
  }
}

module.exports = { log };
