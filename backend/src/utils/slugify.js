'use strict';

const { getPool } = require('../db/client');

/**
 * Converts a string to a URL-safe slug.
 */
function toSlug(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique slug for a given table + column.
 * Appends a numeric suffix on collision: john-doe, john-doe-2, john-doe-3, ...
 */
async function uniqueSlug(base, table, column = 'slug', excludeId = null) {
  const pool = getPool();
  const slug = toSlug(base);
  let candidate = slug;
  let attempt = 1;

  while (true) {
    const params = [candidate];
    let query = `SELECT id FROM ${table} WHERE ${column} = $1`;
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    const { rows } = await pool.query(query, params);
    if (!rows.length) return candidate;
    attempt += 1;
    candidate = `${slug}-${attempt}`;
  }
}

module.exports = { toSlug, uniqueSlug };
