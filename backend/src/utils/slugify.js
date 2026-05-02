'use strict';
const pool = require('../db/client');

function baseSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function uniqueSlug(str, table, column) {
  const base = baseSlug(str);
  const { rows } = await pool.query(
    `SELECT ${column} FROM ${table} WHERE ${column} = $1`,
    [base]
  );
  if (rows.length === 0) return base;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}

module.exports = { baseSlug, uniqueSlug };
