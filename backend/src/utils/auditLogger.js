'use strict';

const { getPool } = require('../db/client');
const logger = require('../logger');

function log({ actor_type, actor_id = null, action, target_type = null, target_id = null, metadata = null, ip_address = null }) {
  const pool = getPool();
  pool.query(
    `INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      actor_type,
      actor_id,
      action,
      target_type,
      target_id,
      metadata ? JSON.stringify(metadata) : null,
      ip_address,
    ]
  ).catch((err) => {
    logger.error('auditLogger: failed to write audit entry', { message: err.message, action });
  });
}

module.exports = { log };
