'use strict';

const { getPool } = require('../db/client');
const logger = require('../logger');

/**
 * Fire-and-forget audit log writer.
 * Never throws — errors are swallowed and logged to the app logger.
 */
function writeAudit({ actorId, actorType, action, targetId, targetType, metadata = {}, ip }) {
  setImmediate(async () => {
    try {
      await getPool().query(
        `INSERT INTO audit_log (actor_id, actor_type, action, target_id, target_type, metadata, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [actorId || null, actorType || null, action, targetId || null, targetType || null, metadata, ip || null],
      );
    } catch (err) {
      logger.error('Failed to write audit log', { action, error: err.message });
    }
  });
}

module.exports = { writeAudit };
