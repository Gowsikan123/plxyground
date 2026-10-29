'use strict';
const sql = require('../db/client');
const logger = require('../logger');

/**
 * Permanently removes a creator or business and everything they own:
 * posts, listings (and applications to them), applications they made,
 * follows, conversations, notifications, blocks, reports they filed,
 * and their uploaded photos. Reports filed *about* them are kept so
 * moderators keep the history; the admin view shows them as deleted.
 *
 * Statements run one by one (the Neon HTTP driver has no session
 * transactions) and are ordered so a failure part-way can simply be retried.
 */
async function deleteAccount({ type, id }) {
  // Conversations (messages cascade with the thread).
  await sql`
    DELETE FROM message_threads
    WHERE (participant_a_type = ${type} AND participant_a_id = ${id})
       OR (participant_b_type = ${type} AND participant_b_id = ${id})`;
  await sql`DELETE FROM notifications WHERE recipient_type = ${type} AND recipient_id = ${id}`;
  await sql`
    DELETE FROM blocks
    WHERE (blocker_type = ${type} AND blocker_id = ${id}) OR (blocked_type = ${type} AND blocked_id = ${id})`;
  await sql`DELETE FROM reports WHERE reporter_type = ${type} AND reporter_id = ${id}`;
  // Listings they posted; applications to them cascade.
  await sql`DELETE FROM opportunities WHERE posted_by_type = ${type} AND posted_by_id = ${id}`;

  if (type === 'creator') {
    await sql`
      DELETE FROM moderation_queue
      WHERE content_type IN ('content', 'creator_content')
        AND content_id IN (SELECT id FROM content WHERE creator_id = ${id})`;
    // Keep other creators' follower counts right before the follow rows cascade away.
    await sql`
      UPDATE creators SET follower_count = GREATEST(follower_count - 1, 0)
      WHERE id IN (SELECT following_id FROM follows WHERE follower_id = ${id})`;
    // Cascades: creator_accounts, content, applications, follows.
    await sql`DELETE FROM creators WHERE id = ${id}`;
  } else {
    await sql`
      DELETE FROM moderation_queue
      WHERE content_type = 'business_content'
        AND content_id IN (SELECT id FROM business_content WHERE business_id = ${id})`;
    // Cascades: business_content.
    await sql`DELETE FROM businesses WHERE id = ${id}`;
  }

  await deleteUploads(`uploads/${type}-${id}/`);
}

// Best effort: a leftover photo is not worth failing the deletion over.
async function deleteUploads(prefix) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const { list, del } = require('@vercel/blob');
    let cursor;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      if (page.blobs.length) await del(page.blobs.map((b) => b.url));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } catch (err) {
    logger.error(`deleteUploads(${prefix}): ${err.message}`);
  }
}

module.exports = { deleteAccount };
