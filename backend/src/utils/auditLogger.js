'use strict';

const pool = require('../db/client');
const logger = require('../logger');

/**
 * Fire-and-forget audit log writer.
 * Never throws — failures are logged but do not surface to callers.
 *
 * @param {object} opts
 * @param {'admin'|'creator'|'business'|'system'} opts.actorType
 * @param {number|null}  opts.actorId
 * @param {string}       opts.action      - e.g. 'APPROVE_CONTENT'
 * @param {string|null}  opts.targetType  - e.g. 'content'
 * @param {number|null}  opts.targetId
 * @param {object|null}  opts.meta        - any extra JSON
 */
function auditLog({ actorType, actorId = null, action, targetType = null, targetId = null, meta = null }) {
  pool.query(
    `INSERT INTO audit_log (actor_type, actor_id, action, target_type, target_id, meta)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [actorType, actorId, action, targetType, targetId, meta ? JSON.stringify(meta) : null]
  ).catch((err) => {
    logger.error('auditLog write failed', err);
  });
}

module.exports = auditLog;
