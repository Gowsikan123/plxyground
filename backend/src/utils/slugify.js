'use strict';
const sql = require('../db/client');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SLUG_TABLES = new Set(['creators', 'businesses']);

async function ensureUniqueSlug(table, baseSlug) {
  if (!SLUG_TABLES.has(table)) throw new Error(`ensureUniqueSlug: unsupported table ${table}`);
  let slug = baseSlug || 'user';
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { rows } = await sql.query(`SELECT id FROM ${table} WHERE slug = $1`, [slug]);
    if (rows.length === 0) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

module.exports = { slugify, ensureUniqueSlug };
