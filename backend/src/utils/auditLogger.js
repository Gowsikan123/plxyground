'use strict';

const pool = require('../db/client');
const logger = require('../logger');

/**
 * Fire-and-forget audit log writer.
 * @param {object} opts
 * @param {'admin'|'creator'|'business'|'system'} opts.actorType
 * @param {number|null} opts.actorId
 * @param {string} opts.action
 * @param {string|null} [opts.targetType]
 * @param {number|null} [opts.targetId]
 * @param {object|null} [opts.metadata]
 * @param {string|null} [opts.ipAddress]
 */
function auditLog({ actorType, actorId, action, targetType = null, targetId = null, metadata = null, ipAddress = null }) {
  pool.query(
    `INSERT INTO audit_log (actortype, actorid, action, targettype, targetid, metadata, ipaddress)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [actorType, actorId, action, targetType, targetId, metadata ? JSON.stringify(metadata) : null, ipAddress]
  ).catch((err) => {
    logger.error('auditLog write failed', err);
  });
}

module.exports = auditLog;
