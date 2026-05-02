'use strict';
const db = require('../db/client');

function logAudit({ actorType, actorId = null, action, targetType = '', targetId = null, metadata = {}, ipAddress = '' }) {
  db.prepare(
    `INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, metadata, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(actorType, actorId, action, targetType, targetId, JSON.stringify(metadata), ipAddress);
}

module.exports = { logAudit };
