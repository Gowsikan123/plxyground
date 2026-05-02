'use strict';
const pool = require('../db/client');
const logger = require('../logger');

async function log({ actor_type, actor_id, action, target_type, target_id, ip_address, metadata }) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (actor_type, actor_id, action, target_type, target_id, ip_address, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [actor_type, actor_id, action, target_type || null, target_id || null, ip_address || null, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    logger.error('Failed to write audit log', { message: err.message });
  }
}

module.exports = { log };
