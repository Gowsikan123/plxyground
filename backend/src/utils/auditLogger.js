'use strict';
const db = require('../db/client');
const logger = require('../logger');

const insertAudit = db.prepare(
  'INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, metadata, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

function log({ actor_type, actor_id = null, action, target_type = '', target_id = null, metadata = {}, ip_address = '' }) {
  try {
    insertAudit.run(
      actor_type,
      actor_id,
      action,
      target_type,
      target_id,
      JSON.stringify(metadata),
      ip_address
    );
  } catch (err) {
    logger.error(`Audit log failed: ${err.message}`);
  }
}

module.exports = { log };
