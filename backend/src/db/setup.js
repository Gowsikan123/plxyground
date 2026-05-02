'use strict';

const { getPool } = require('./client');
const logger = require('../logger');

async function setup() {
  const pool = getPool();

  const sql = `
    CREATE TABLE IF NOT EXISTS creators (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50)  UNIQUE NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT         NOT NULL,
      display_name  VARCHAR(100),
      bio           TEXT,
      sport         VARCHAR(50),
      avatar_url    TEXT,
      slug          VARCHAR(80)  UNIQUE,
      follower_count INT         NOT NULL DEFAULT 0,
      is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
      is_suspended  BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id            SERIAL PRIMARY KEY,
      company_name  VARCHAR(150) NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT         NOT NULL,
      website       TEXT,
      bio           TEXT,
      logo_url      TEXT,
      slug          VARCHAR(80)  UNIQUE,
      is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
      is_suspended  BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admins (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50)  UNIQUE NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT         NOT NULL,
      role          VARCHAR(30)  NOT NULL DEFAULT 'moderator',
      is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content (
      id            SERIAL PRIMARY KEY,
      creator_id    INT          NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      title         VARCHAR(200) NOT NULL,
      body          TEXT,
      media_url     TEXT,
      media_type    VARCHAR(20)  NOT NULL DEFAULT 'none',
      tags          TEXT[]       NOT NULL DEFAULT '{}',
      sport         VARCHAR(50),
      status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
      view_count    INT          NOT NULL DEFAULT 0,
      like_count    INT          NOT NULL DEFAULT 0,
      is_flagged    BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id            SERIAL PRIMARY KEY,
      poster_id     INT          NOT NULL,
      poster_type   VARCHAR(20)  NOT NULL CHECK (poster_type IN ('creator','business')),
      title         VARCHAR(200) NOT NULL,
      description   TEXT         NOT NULL,
      sport         VARCHAR(50),
      budget        VARCHAR(100),
      location      VARCHAR(150),
      deadline      DATE,
      status        VARCHAR(20)  NOT NULL DEFAULT 'open',
      tags          TEXT[]       NOT NULL DEFAULT '{}',
      applications  INT          NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS applications (
      id              SERIAL PRIMARY KEY,
      opportunity_id  INT         NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      creator_id      INT         NOT NULL REFERENCES creators(id)      ON DELETE CASCADE,
      message         TEXT,
      status          VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (opportunity_id, creator_id)
    );

    CREATE TABLE IF NOT EXISTS moderation_queue (
      id            SERIAL PRIMARY KEY,
      content_id    INT          REFERENCES content(id) ON DELETE SET NULL,
      reason        VARCHAR(100),
      status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
      reviewed_by   INT          REFERENCES admins(id),
      reviewed_at   TIMESTAMPTZ,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id            SERIAL PRIMARY KEY,
      actor_id      INT,
      actor_type    VARCHAR(20),
      action        VARCHAR(100) NOT NULL,
      target_id     INT,
      target_type   VARCHAR(50),
      metadata      JSONB        NOT NULL DEFAULT '{}',
      ip_address    VARCHAR(45),
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_content_creator  ON content(creator_id);
    CREATE INDEX IF NOT EXISTS idx_content_status   ON content(status);
    CREATE INDEX IF NOT EXISTS idx_content_sport    ON content(sport);
    CREATE INDEX IF NOT EXISTS idx_opps_poster      ON opportunities(poster_id, poster_type);
    CREATE INDEX IF NOT EXISTS idx_opps_status      ON opportunities(status);
    CREATE INDEX IF NOT EXISTS idx_audit_actor      ON audit_log(actor_id, actor_type);
    CREATE INDEX IF NOT EXISTS idx_audit_created    ON audit_log(created_at);
  `;

  await pool.query(sql);
  logger.info('Database tables created / verified');
}

module.exports = { setup };
