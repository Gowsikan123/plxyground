-- Migration: add password reset token columns to creator_accounts
-- Run once against your PostgreSQL database.
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks).

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='creator_accounts' AND column_name='reset_token_hash'
  ) THEN
    ALTER TABLE creator_accounts
      ADD COLUMN reset_token_hash TEXT,
      ADD COLUMN reset_token_expires_at TIMESTAMPTZ;
  END IF;
END $$;
