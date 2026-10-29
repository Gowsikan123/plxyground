'use strict';
const sql = require('../db/client');

/** The signed-in person as { type, id }, where id is the creator or business id. */
function actorOf(req) {
  return { type: req.userType, id: req.userType === 'creator' ? req.user.creator_id : req.user.id };
}

/** True if either person has blocked the other. Blocking works both ways. */
async function isBlockedBetween(a, b) {
  const rows = await sql`
    SELECT 1 FROM blocks
    WHERE (blocker_type = ${a.type} AND blocker_id = ${a.id} AND blocked_type = ${b.type} AND blocked_id = ${b.id})
       OR (blocker_type = ${b.type} AND blocker_id = ${b.id} AND blocked_type = ${a.type} AND blocked_id = ${a.id})
    LIMIT 1`;
  return rows.length > 0;
}

/** Creator ids hidden from this person: anyone they blocked or who blocked them. */
async function hiddenCreatorIds(viewer) {
  const rows = await sql`
    SELECT blocked_id AS id FROM blocks
      WHERE blocker_type = ${viewer.type} AND blocker_id = ${viewer.id} AND blocked_type = 'creator'
    UNION
    SELECT blocker_id AS id FROM blocks
      WHERE blocked_type = ${viewer.type} AND blocked_id = ${viewer.id} AND blocker_type = 'creator'`;
  return rows.map((r) => r.id);
}

module.exports = { actorOf, isBlockedBetween, hiddenCreatorIds };
