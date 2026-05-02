'use strict';
const db = require('../db/client');

/**
 * Convert a string to a URL-safe slug.
 * e.g. "Jordan Hoops 🏀" → "jordan-hoops"
 */
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-{2,}/g, '-');
}

/**
 * Generate a unique slug for a given table + column, appending
 * a numeric suffix if the base slug already exists.
 *
 * @param {string} base      - already-slugified string
 * @param {string} table     - table name (users | businesses)
 * @param {number} [excludeId] - row id to ignore (for updates)
 */
async function uniqueSlug(base, table, excludeId = null) {
  const ALLOWED_TABLES = ['users', 'businesses'];
  if (!ALLOWED_TABLES.includes(table)) throw new Error(`uniqueSlug: disallowed table '${table}'`);

  let candidate = base;
  let suffix = 1;

  while (true) {
    const params = [candidate];
    let sql = `SELECT id FROM ${table} WHERE slug = $1`;
    if (excludeId) {
      sql += ` AND id != $2`;
      params.push(excludeId);
    }
    const res = await db.query(sql, params);
    if (res.rows.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}

module.exports = { slugify, uniqueSlug };
