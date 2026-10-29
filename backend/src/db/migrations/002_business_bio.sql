-- Migration 002: business sign-up stores a short bio.
-- Idempotent — safe to run multiple times.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS bio TEXT;
