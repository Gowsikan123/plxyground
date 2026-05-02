'use strict';
const db = require('../db/client');
const logger = require('../logger');

/**
 * Fire-and-forget audit log writer.
 * Never throws — failures are logged but do not block the request.
 *
 * @param {object} opts
 * @param {number|null}  opts.actorId
 * @param {'user'|'business'|'admin'|'system'} opts.actorType
 * @param {string}  opts.action       e.g. 'content.approve'
 * @param {string}  [opts.targetType] e.g. 'content'
 * @param {number}  [opts.targetId]
 * @param {object}  [opts.meta]
 * @param {string}  [opts.ip]
 */
function auditLog({ actorId = null, actorType = 'system', action, targetType = null, targetId = null, meta = {}, ip = null } = {}) {
  db.query(
    `INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id, meta, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7::inet)`,
    [actorId, actorType, action, targetType, targetId, JSON.stringify(meta), ip],
  ).catch((err) => {
    logger.error('auditLog write failed', { message: err.message, action });
  });
}

module.exports = { auditLog };
