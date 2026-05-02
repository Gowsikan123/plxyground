'use strict';
const pool = require('../db/client');

function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-');
}

async function uniqueSlug(base, table, column = 'slug') {
  const slug = toSlug(base);
  const { rows } = await pool.query(`SELECT 1 FROM ${table} WHERE ${column} = $1`, [slug]);
  if (rows.length === 0) return slug;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug}-${suffix}`;
}

module.exports = { toSlug, uniqueSlug };
