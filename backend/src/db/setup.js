'use strict';

const pool = require('./client');
const logger = require('../logger');

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS admins (
    id           SERIAL PRIMARY KEY,
    email        TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS creators (
    id             SERIAL PRIMARY KEY,
    name           TEXT NOT NULL,
    slug           TEXT NOT NULL UNIQUE,
    sport          TEXT,
    bio            TEXT,
    avatar_url     TEXT,
    follower_count INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS creator_accounts (
    id            SERIAL PRIMARY KEY,
    creator_id    INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'admin')),
    is_suspended  BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS businesses (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    website       TEXT,
    bio           TEXT,
    is_suspended  BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS content (
    id          SERIAL PRIMARY KEY,
    creator_id  INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    sport       TEXT,
    media_url   TEXT,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS business_content (
    id            SERIAL PRIMARY KEY,
    business_id   INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    body          TEXT NOT NULL,
    target_sport  TEXT,
    budget_min    NUMERIC(10,2),
    budget_max    NUMERIC(10,2),
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS opportunities (
    id           SERIAL PRIMARY KEY,
    posted_by    TEXT NOT NULL,
    poster_id    INTEGER NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL,
    sport        TEXT,
    pay          NUMERIC(10,2),
    deadline     DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS moderation_queue (
    id           SERIAL PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('content', 'business_content')),
    content_id   INTEGER NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes        TEXT,
    reviewed_by  INTEGER REFERENCES admins(id),
    reviewed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id          SERIAL PRIMARY KEY,
    actor_type  TEXT NOT NULL CHECK (actor_type IN ('admin', 'creator', 'business', 'system')),
    actor_id    INTEGER,
    action      TEXT NOT NULL,
    target_type TEXT,
    target_id   INTEGER,
    meta        JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

async function setupDatabase() {
  logger.info('Running database setup...');
  await pool.query(CREATE_TABLES);
  logger.info('All tables ready.');

  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM admins');
  if (parseInt(rows[0].count, 10) === 0) {
    logger.info('Empty database detected — running seed...');
    const seed = require('./seed');
    await seed();
  }
}

module.exports = setupDatabase;
