'use strict';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureUniqueSlug(db, table, slug) {
  const existing = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug);
  if (!existing) return slug;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug}-${suffix}`;
}

module.exports = { slugify, ensureUniqueSlug };
