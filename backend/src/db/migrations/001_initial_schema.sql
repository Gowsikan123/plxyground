-- Migration 001: Initial schema
-- Run via: node src/db/migrate.js
-- Idempotent — safe to run multiple times.

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(50)  UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  sport       VARCHAR(100),
  location    VARCHAR(100),
  followers   INTEGER DEFAULT 0,
  following   INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
  id           SERIAL PRIMARY KEY,
  business_name VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  logo_url      TEXT,
  website       TEXT,
  description   TEXT,
  industry      VARCHAR(100),
  is_verified   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50) UNIQUE NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       VARCHAR(20) DEFAULT 'moderator',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  content_type  VARCHAR(50),
  media_url     TEXT,
  thumbnail_url TEXT,
  status        VARCHAR(20) DEFAULT 'pending',
  likes         INTEGER DEFAULT 0,
  views         INTEGER DEFAULT 0,
  slug          VARCHAR(255) UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id            SERIAL PRIMARY KEY,
  business_id   INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  content_type  VARCHAR(50),
  budget        NUMERIC(10,2),
  deadline      DATE,
  requirements  TEXT,
  is_open       BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id               SERIAL PRIMARY KEY,
  opportunity_id   INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message          TEXT,
  portfolio_url    TEXT,
  status           VARCHAR(20) DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, user_id)
);

CREATE TABLE IF NOT EXISTS follows (
  id          SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         SERIAL PRIMARY KEY,
  admin_id   INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,
  target     VARCHAR(100),
  target_id  INTEGER,
  detail     JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_content_user_id    ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_status     ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_business_id ON opportunities(business_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_is_open     ON opportunities(is_open);
CREATE INDEX IF NOT EXISTS idx_applications_user_id      ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower           ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following          ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread  ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at       ON audit_log(created_at DESC);
