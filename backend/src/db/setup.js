'use strict';

const pool = require('./client');
const logger = require('../logger');

async function setup() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id           SERIAL PRIMARY KEY,
      email        TEXT UNIQUE NOT NULL,
      passwordhash TEXT NOT NULL,
      createdat    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS creators (
      id            SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      slug          TEXT UNIQUE NOT NULL,
      displayname   TEXT NOT NULL,
      bio           TEXT,
      avatarurl     TEXT,
      sport         TEXT,
      location      TEXT,
      followercount INTEGER DEFAULT 0,
      isverified    BOOLEAN DEFAULT FALSE,
      createdat     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS creator_accounts (
      id               SERIAL PRIMARY KEY,
      creatorid        INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      email            TEXT UNIQUE NOT NULL,
      passwordhash     TEXT NOT NULL,
      role             TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'admin')),
      issuspended      BOOLEAN DEFAULT FALSE,
      isemailverified  BOOLEAN DEFAULT FALSE,
      lastlogin        TIMESTAMPTZ,
      createdat        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id               SERIAL PRIMARY KEY,
      email            TEXT UNIQUE NOT NULL,
      passwordhash     TEXT NOT NULL,
      companyname      TEXT NOT NULL,
      slug             TEXT UNIQUE NOT NULL,
      bio              TEXT,
      logourl          TEXT,
      industry         TEXT,
      website          TEXT,
      location         TEXT,
      issuspended      BOOLEAN DEFAULT FALSE,
      isemailverified  BOOLEAN DEFAULT FALSE,
      lastlogin        TIMESTAMPTZ,
      createdat        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content (
      id          SERIAL PRIMARY KEY,
      creatorid   INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      body        TEXT,
      mediaurl    TEXT,
      mediatype   TEXT DEFAULT 'none' CHECK (mediatype IN ('image', 'video', 'none')),
      tags        JSONB DEFAULT '[]',
      status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'deleted')),
      viewcount   INTEGER DEFAULT 0,
      likecount   INTEGER DEFAULT 0,
      createdat   TIMESTAMPTZ DEFAULT NOW(),
      updatedat   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS business_content (
      id           SERIAL PRIMARY KEY,
      businessid   INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      title        TEXT NOT NULL,
      body         TEXT,
      mediaurl     TEXT,
      budgetrange  TEXT,
      targetsport  TEXT,
      status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected', 'deleted')),
      createdat    TIMESTAMPTZ DEFAULT NOW(),
      updatedat    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id            SERIAL PRIMARY KEY,
      postedbytype  TEXT NOT NULL CHECK (postedbytype IN ('creator', 'business')),
      postedbyid    INTEGER NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL,
      sport         TEXT,
      location      TEXT,
      budget        TEXT,
      deadline      TEXT,
      status        TEXT DEFAULT 'published' CHECK (status IN ('published', 'closed', 'deleted')),
      createdat     TIMESTAMPTZ DEFAULT NOW(),
      updatedat     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS moderation_queue (
      id          SERIAL PRIMARY KEY,
      contenttype TEXT NOT NULL CHECK (contenttype IN ('creator_content', 'business_content')),
      contentid   INTEGER NOT NULL,
      status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      reviewedby  INTEGER REFERENCES admins(id),
      reviewnote  TEXT,
      submittedat TIMESTAMPTZ DEFAULT NOW(),
      reviewedat  TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id         SERIAL PRIMARY KEY,
      actortype  TEXT NOT NULL CHECK (actortype IN ('admin', 'creator', 'business', 'system')),
      actorid    INTEGER,
      action     TEXT NOT NULL,
      targettype TEXT,
      targetid   INTEGER,
      metadata   JSONB,
      ipaddress  TEXT,
      createdat  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  logger.info('Database schema ready');

  const { rows } = await pool.query('SELECT COUNT(*) FROM admins');
  if (parseInt(rows[0].count, 10) === 0) {
    logger.info('No admins found — running seed');
    const seed = require('./seed');
    await seed();
  }
}

module.exports = setup;
