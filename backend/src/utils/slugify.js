'use strict';

const { getPool } = require('../db/client');

function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(base, table, column = 'slug') {
  const pool = getPool();
  const slug = toSlug(base);

  const { rows } = await pool.query(
    `SELECT $3 FROM $1 WHERE $2 = $3 LIMIT 1`,
    [table, column, slug]
  );

  if (rows.length === 0) return slug;

  // Collision — append a random 4-digit suffix
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const candidate = `${slug}-${suffix}`;

  const { rows: rows2 } = await pool.query(
    `SELECT $2 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
    [candidate, column]
  );

  if (rows2.length === 0) return candidate;

  // Extremely unlikely second collision — append timestamp ms
  return `${slug}-${Date.now()}`;
}

module.exports = { toSlug, generateUniqueSlug };
