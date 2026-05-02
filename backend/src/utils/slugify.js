'use strict';
const pool = require('../db/client');

function baseSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueSlug(str, table, column = 'slug') {
  const slug = baseSlug(str);
  const result = await pool.query(
    `SELECT COUNT(*) FROM ${table} WHERE ${column} = $1`,
    [slug]
  );
  if (parseInt(result.rows[0].count, 10) === 0) return slug;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug}-${suffix}`;
}

module.exports = { baseSlug, generateUniqueSlug };
