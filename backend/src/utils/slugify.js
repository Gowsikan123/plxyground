'use strict';
const sql = require('../db/client');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUniqueSlug(table, baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const rows = await sql`SELECT id FROM ${sql(table)} WHERE slug = ${slug}`;
    if (rows.length === 0) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

module.exports = { slugify, ensureUniqueSlug };
