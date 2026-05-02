'use strict';

const { getPool } = require('../db/client');

function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uniqueSlug(base, table, column = 'slug', excludeId = null) {
  const pool = getPool();
  const slug = toSlug(base);

  let candidate = slug;
  let attempts = 0;

  while (true) {
    let query, params;
    if (excludeId) {
      query = `SELECT id FROM ${table} WHERE ${column} = $1 AND id != $2 LIMIT 1`;
      params = [candidate, excludeId];
    } else {
      query = `SELECT id FROM ${table} WHERE ${column} = $1 LIMIT 1`;
      params = [candidate];
    }

    const { rows } = await pool.query(query, params);
    if (rows.length === 0) break;

    attempts++;
    const suffix = Math.floor(1000 + Math.random() * 9000);
    candidate = `${slug}-${suffix}`;

    if (attempts > 20) {
      candidate = `${slug}-${Date.now()}`;
      break;
    }
  }

  return candidate;
}

module.exports = { toSlug, uniqueSlug };
