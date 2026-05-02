'use strict';

const db = require('./client');
const logger = require('../logger');

const CREATE_TABLES = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    display_name  VARCHAR(100),
    bio           TEXT,
    avatar_url    TEXT,
    sport         VARCHAR(50),
    position      VARCHAR(50),
    location      VARCHAR(100),
    follower_count INTEGER      NOT NULL DEFAULT 0,
    following_count INTEGER     NOT NULL DEFAULT 0,
    is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    is_suspended  BOOLEAN      NOT NULL DEFAULT FALSE,
    slug          VARCHAR(100) UNIQUE,
    role          VARCHAR(20)  NOT NULL DEFAULT 'creator' CHECK (role IN ('creator','admin')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS businesses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    company_name  VARCHAR(150) NOT NULL,
    industry      VARCHAR(100),
    website       VARCHAR(255),
    logo_url      TEXT,
    description   TEXT,
    contact_name  VARCHAR(100),
    contact_phone VARCHAR(30),
    is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    is_suspended  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS content (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(200),
    body          TEXT,
    media_url     TEXT,
    media_type    VARCHAR(20)  CHECK (media_type IN ('image','video','audio','none')),
    sport         VARCHAR(50),
    tags          TEXT[]       DEFAULT '{}',
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    rejection_reason TEXT,
    like_count    INTEGER      NOT NULL DEFAULT 0,
    view_count    INTEGER      NOT NULL DEFAULT 0,
    comment_count INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS opportunities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    sport           VARCHAR(50),
    budget_min      NUMERIC(12,2),
    budget_max      NUMERIC(12,2),
    currency        VARCHAR(3)   NOT NULL DEFAULT 'GBP',
    deadline        DATE,
    requirements    TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','draft')),
    application_count INTEGER    NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID        NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message         TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (opportunity_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, content_id)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL    PRIMARY KEY,
    actor_id    UUID,
    actor_type  VARCHAR(20)  NOT NULL DEFAULT 'system' CHECK (actor_type IN ('creator','business','admin','system')),
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id   UUID,
    meta        JSONB        DEFAULT '{}',
    ip          VARCHAR(45),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    business_id UUID,
    token_hash  TEXT         UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_content_user_id    ON content(user_id);
  CREATE INDEX IF NOT EXISTS idx_content_status     ON content(status);
  CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_actor        ON audit_log(actor_id);
  CREATE INDEX IF NOT EXISTS idx_audit_created_at   ON audit_log(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_opportunities_biz  ON opportunities(business_id);
  CREATE INDEX IF NOT EXISTS idx_applications_user  ON applications(user_id);
`;

async function setupDatabase() {
  logger.info('db: running schema setup...');
  try {
    await db.query(CREATE_TABLES);
    logger.info('db: schema setup complete');
  } catch (err) {
    logger.error('db: schema setup failed', { message: err.message });
    throw err;
  }
}

module.exports = { setupDatabase };
