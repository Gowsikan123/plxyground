'use strict';

const db = require('../db/client');

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Jamal Baller 🏀" → "jamal-baller"
 */
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

/**
 * Generate a unique slug for a users row.
 * If the base slug is taken, append -2, -3, etc.
 *
 * @param {string} base - raw display name or username
 * @param {string|null} [excludeId] - existing user id to exclude from uniqueness check
 * @returns {Promise<string>}
 */
async function uniqueUserSlug(base, excludeId = null) {
  const baseSlug = toSlug(base);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const { rows } = await db.query(
      `SELECT id FROM users WHERE slug = $1 AND ($2::uuid IS NULL OR id <> $2)`,
      [candidate, excludeId]
    );
    if (rows.length === 0) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

module.exports = { toSlug, uniqueUserSlug };
