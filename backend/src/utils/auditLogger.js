'use strict';
const db = require('../db/client');

function log({ actor_type, actor_id = null, action, target_type = null, target_id = null, metadata = null, ip_address = null }) {
  try {
    db.prepare(`
      INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, metadata, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      actor_type,
      actor_id,
      action,
      target_type,
      target_id,
      metadata ? JSON.stringify(metadata) : null,
      ip_address
    );
  } catch (err) {
    console.error('[auditLogger] Failed to write audit log:', err.message);
  }
}

module.exports = { log };
