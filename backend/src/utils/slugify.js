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

/**
 * Ensures a slug is unique within a given table.
 * Signature supports two call styles:
 *   ensureUniqueSlug(table, slug)           — auto-requires db client
 *   ensureUniqueSlug(dbInstance, table, slug) — explicit db (legacy)
 */
function ensureUniqueSlug(dbOrTable, tableOrSlug, slugOrUndefined) {
  let db, table, slug;
  if (slugOrUndefined === undefined) {
    // Called as ensureUniqueSlug(table, slug)
    db = require('../db/client');
    table = dbOrTable;
    slug = tableOrSlug;
  } else {
    // Called as ensureUniqueSlug(db, table, slug)
    db = dbOrTable;
    table = tableOrSlug;
    slug = slugOrUndefined;
  }
  const existing = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug);
  if (!existing) return slug;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slug}-${suffix}`;
}

module.exports = { slugify, ensureUniqueSlug };
