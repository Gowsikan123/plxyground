'use strict';

const pool = require('../db/client');

/**
 * Converts a string to a URL-safe slug.
 * e.g. "Jordan Miles" => "jordan-miles"
 * @param {string} text
 * @returns {string}
 */
function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique slug for a creator, appending a numeric suffix on collision.
 * @param {string} name
 * @returns {Promise<string>}
 */
async function uniqueCreatorSlug(name) {
  const base = toSlug(name);
  let slug = base;
  let suffix = 1;

  while (true) {
    const { rows } = await pool.query(
      'SELECT id FROM creators WHERE slug = $1',
      [slug]
    );
    if (rows.length === 0) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

module.exports = { toSlug, uniqueCreatorSlug };
