'use strict';
const logger = require('../logger');

let db;
function getDb() {
  if (!db) db = require('../db/client');
  return db;
}

function log({ actor_type, actor_id = null, action, target_type = '', target_id = null, metadata = {}, ip_address = '' }) {
  try {
    const stmt = getDb().prepare(`
      INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, metadata, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(actor_type, actor_id, action, target_type, target_id, JSON.stringify(metadata), ip_address);
  } catch (err) {
    logger.error(`auditLogger failed: ${err.message}`);
  }
}

module.exports = { log };
