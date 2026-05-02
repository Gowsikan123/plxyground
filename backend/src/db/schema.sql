-- Plxyground database schema
-- Run once: node src/db/migrate.js
-- Or: psql $DATABASE_URL -f src/db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CREATORS
-- ============================================================
CREATE TABLE IF NOT EXISTS creators (
  id               SERIAL PRIMARY KEY,
  username         TEXT UNIQUE NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  display_name     TEXT NOT NULL,
  bio              TEXT,
  avatar_url       TEXT,
  sport            TEXT,
  location         TEXT,
  follower_count   INTEGER NOT NULL DEFAULT 0,
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_accounts (
  id             SERIAL PRIMARY KEY,
  creator_id     INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  is_suspended   BOOLEAN NOT NULL DEFAULT FALSE,
  last_login     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id             SERIAL PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  company_name   TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  industry       TEXT,
  website        TEXT,
  location       TEXT,
  logo_url       TEXT,
  is_suspended   BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  last_login     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id             SERIAL PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'admin',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTENT (creator posts)
-- ============================================================
CREATE TABLE IF NOT EXISTS content (
  id           SERIAL PRIMARY KEY,
  creator_id   INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT,
  media_url    TEXT,
  media_type   TEXT NOT NULL DEFAULT 'none' CHECK (media_type IN ('image','video','none')),
  tags         JSONB NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected','deleted')),
  view_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BUSINESS CONTENT
-- ============================================================
CREATE TABLE IF NOT EXISTS business_content (
  id              SERIAL PRIMARY KEY,
  business_id     INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT,
  budget_range    TEXT,
  target_sport    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected','deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id              SERIAL PRIMARY KEY,
  posted_by_type  TEXT NOT NULL CHECK (posted_by_type IN ('creator','business')),
  posted_by_id    INTEGER NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  sport           TEXT,
  location        TEXT,
  budget          TEXT,
  deadline        DATE,
  status          TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','closed','deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id               SERIAL PRIMARY KEY,
  opportunity_id   INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  creator_id       INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  message          TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(opportunity_id, creator_id)
);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id   INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  following_id  INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS message_threads (
  id                    SERIAL PRIMARY KEY,
  participant_a_type    TEXT NOT NULL,
  participant_a_id      INTEGER NOT NULL,
  participant_b_type    TEXT NOT NULL,
  participant_b_id      INTEGER NOT NULL,
  last_message_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id           SERIAL PRIMARY KEY,
  thread_id    INTEGER NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_type  TEXT NOT NULL,
  sender_id    INTEGER NOT NULL,
  body         TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id               SERIAL PRIMARY KEY,
  recipient_type   TEXT NOT NULL,
  recipient_id     INTEGER NOT NULL,
  type             TEXT NOT NULL,
  title            TEXT NOT NULL,
  body             TEXT,
  reference_type   TEXT,
  reference_id     INTEGER,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MODERATION
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_queue (
  id                SERIAL PRIMARY KEY,
  content_type      TEXT NOT NULL,
  content_id        INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by       INTEGER,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           SERIAL PRIMARY KEY,
  actor_type   TEXT NOT NULL,
  actor_id     INTEGER NOT NULL,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    INTEGER,
  ip_address   TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_content_creator ON content(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_applications_creator ON applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_queue(status);
