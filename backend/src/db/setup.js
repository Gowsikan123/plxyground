'use strict';
const db = require('./client');
const logger = require('../logger');
const config = require('../config');

async function setup() {
  logger.info('Running DB setup…');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50)  UNIQUE NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT         NOT NULL,
      display_name  VARCHAR(100),
      bio           TEXT,
      avatar_url    TEXT,
      sport         VARCHAR(50),
      slug          VARCHAR(100) UNIQUE,
      is_verified   BOOLEAN      DEFAULT FALSE,
      is_suspended  BOOLEAN      DEFAULT FALSE,
      follower_count INT         DEFAULT 0,
      created_at    TIMESTAMPTZ  DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(150) NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT         NOT NULL,
      description   TEXT,
      logo_url      TEXT,
      website       TEXT,
      industry      VARCHAR(100),
      slug          VARCHAR(100) UNIQUE,
      is_verified   BOOLEAN      DEFAULT FALSE,
      is_suspended  BOOLEAN      DEFAULT FALSE,
      created_at    TIMESTAMPTZ  DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50)  UNIQUE NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT         NOT NULL,
      role          VARCHAR(30)  DEFAULT 'admin',
      is_active     BOOLEAN      DEFAULT TRUE,
      last_login_at TIMESTAMPTZ,
      created_at    TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS content (
      id            SERIAL PRIMARY KEY,
      user_id       INT          REFERENCES users(id) ON DELETE CASCADE,
      title         TEXT         NOT NULL,
      body          TEXT,
      media_url     TEXT,
      media_type    VARCHAR(20)  CHECK (media_type IN ('image','video','reel','short')),
      sport         VARCHAR(50),
      tags          TEXT[]       DEFAULT '{}',
      likes_count   INT          DEFAULT 0,
      comments_count INT         DEFAULT 0,
      status        VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','flagged')),
      moderation_note TEXT,
      moderated_by  INT          REFERENCES admins(id) ON DELETE SET NULL,
      moderated_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ  DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id              SERIAL PRIMARY KEY,
      business_id     INT          REFERENCES businesses(id) ON DELETE CASCADE,
      title           VARCHAR(200) NOT NULL,
      description     TEXT         NOT NULL,
      sport           VARCHAR(50),
      type            VARCHAR(50)  CHECK (type IN ('sponsorship','collab','ambassador','appearance','other')),
      budget_min      NUMERIC(12,2),
      budget_max      NUMERIC(12,2),
      deadline        DATE,
      location        VARCHAR(150),
      remote_ok       BOOLEAN      DEFAULT FALSE,
      status          VARCHAR(20)  DEFAULT 'open' CHECK (status IN ('open','closed','draft')),
      applications_count INT       DEFAULT 0,
      created_at      TIMESTAMPTZ  DEFAULT NOW(),
      updated_at      TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id              SERIAL PRIMARY KEY,
      opportunity_id  INT          REFERENCES opportunities(id) ON DELETE CASCADE,
      user_id         INT          REFERENCES users(id) ON DELETE CASCADE,
      message         TEXT,
      status          VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
      created_at      TIMESTAMPTZ  DEFAULT NOW(),
      updated_at      TIMESTAMPTZ  DEFAULT NOW(),
      UNIQUE(opportunity_id, user_id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id   INT REFERENCES users(id) ON DELETE CASCADE,
      following_id  INT REFERENCES users(id) ON DELETE CASCADE,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (follower_id, following_id)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          BIGSERIAL    PRIMARY KEY,
      actor_id    INT,
      actor_type  VARCHAR(20)  CHECK (actor_type IN ('user','business','admin','system')),
      action      VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id   INT,
      meta        JSONB        DEFAULT '{}',
      ip          INET,
      created_at  TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_content_user_id      ON content(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_content_status        ON content(status);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_content_sport         ON content(sport);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_opportunities_business ON opportunities(business_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_opportunities_status  ON opportunities(status);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_applications_user     ON applications(user_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_actor           ON audit_logs(actor_id, actor_type);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_created         ON audit_logs(created_at DESC);`);

  logger.info('DB setup complete');

  if (config.seed.autoRun) {
    const { seed } = require('./seed');
    await seed();
  }
}

module.exports = { setup };
