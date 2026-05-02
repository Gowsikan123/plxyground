'use strict';
const pool = require('../db/client');

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(base, table) {
  const baseSlug = slugify(base);
  let candidate = baseSlug;
  let i = 1;
  for (;;) {
    const { rows } = await pool.query(`SELECT 1 FROM ${table} WHERE slug = $1`, [candidate]);
    if (!rows[0]) return candidate;
    candidate = `${baseSlug}-${i++}`;
  }
}

module.exports = { slugify, uniqueSlug };
