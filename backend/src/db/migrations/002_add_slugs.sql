-- Migration 002: Add slug to users table
-- Idempotent.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Backfill slugs from existing usernames/business names
-- (safe no-op if already populated)
UPDATE users
SET slug = LOWER(REGEXP_REPLACE(username, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE businesses
SET slug = LOWER(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;
