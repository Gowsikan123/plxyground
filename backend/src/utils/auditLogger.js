'use strict';
const logger = require('../logger');

let _db = null;
function getDb() {
  if (!_db) _db = require('../db/client');
  return _db;
}

function log({ actor_type, actor_id = null, action, target_type = '', target_id = null, metadata = {}, ip_address = '' }) {
  try {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, metadata, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(actor_type, actor_id, action, target_type, target_id, JSON.stringify(metadata), ip_address);
  } catch (err) {
    logger.error(`auditLogger failed: ${err.message}`);
  }
}

module.exports = { log };
