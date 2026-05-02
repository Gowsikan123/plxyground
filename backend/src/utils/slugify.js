'use strict';

const pool = require('../db/client');

/**
 * Generate a URL-safe slug from a string.
 * Appends a numeric suffix if the slug already exists in the given table.
 * @param {string} input
 * @param {'creators'|'businesses'} table
 * @returns {Promise<string>}
 */
async function slugify(input, table) {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const { rows } = await pool.query(
    `SELECT slug FROM ${table} WHERE slug LIKE $1 ORDER BY slug`,
    [`${base}%`]
  );

  if (rows.length === 0) return base;

  const existing = new Set(rows.map((r) => r.slug));
  if (!existing.has(base)) return base;

  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

module.exports = slugify;
