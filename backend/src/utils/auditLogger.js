'use strict';

const db = require('../db/client');
const logger = require('../logger');

/**
 * Fire-and-forget audit log writer.
 * Never throws — failures are logged but do not affect the request lifecycle.
 *
 * @param {object} entry
 * @param {string|null} entry.actorId
 * @param {'creator'|'business'|'admin'|'system'} entry.actorType
 * @param {string} entry.action
 * @param {string|null} [entry.targetType]
 * @param {string|null} [entry.targetId]
 * @param {object}      [entry.meta]
 * @param {string|null} [entry.ip]
 */
function auditLog({ actorId = null, actorType = 'system', action, targetType = null, targetId = null, meta = {}, ip = null }) {
  db.query(
    `INSERT INTO audit_log (actor_id, actor_type, action, target_type, target_id, meta, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [actorId, actorType, action, targetType, targetId, JSON.stringify(meta), ip]
  ).catch((err) => {
    logger.error('auditLog: failed to write audit entry', { action, message: err.message });
  });
}

module.exports = auditLog;
