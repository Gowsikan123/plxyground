'use strict';
const db = require('./client');
const seed = require('./seed');

async function setup() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS creators (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      sport TEXT,
      location TEXT,
      follower_count INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS creator_accounts (
      id SERIAL PRIMARY KEY,
      creator_id INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'creator' CHECK(role IN ('creator','admin')),
      is_suspended INTEGER DEFAULT 0,
      is_email_verified INTEGER DEFAULT 0,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      company_name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      bio TEXT,
      logo_url TEXT,
      industry TEXT,
      website TEXT,
      location TEXT,
      is_suspended INTEGER DEFAULT 0,
      is_email_verified INTEGER DEFAULT 0,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content (
      id SERIAL PRIMARY KEY,
      creator_id INTEGER NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT,
      media_url TEXT,
      media_type TEXT DEFAULT 'none' CHECK(media_type IN ('image','video','none')),
      tags TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','deleted')),
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS business_content (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT,
      media_url TEXT,
      budget_range TEXT,
      target_sport TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','published','rejected','deleted')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id SERIAL PRIMARY KEY,
      posted_by_type TEXT NOT NULL CHECK(posted_by_type IN ('creator','business')),
      posted_by_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      sport TEXT,
      location TEXT,
      budget TEXT,
      deadline TEXT,
      status TEXT DEFAULT 'published' CHECK(status IN ('published','closed','deleted')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS moderation_queue (
      id SERIAL PRIMARY KEY,
      content_type TEXT NOT NULL CHECK(content_type IN ('creator_content','business_content')),
      content_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      reviewed_by INTEGER REFERENCES admins(id),
      review_note TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      action_type TEXT,
      actor TEXT,
      target TEXT,
      before_snapshot TEXT,
      after_snapshot TEXT,
      reason TEXT,
      metadata TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bulk_action_log (
      id SERIAL PRIMARY KEY,
      admin TEXT,
      action_type TEXT,
      target_type TEXT,
      target_ids TEXT,
      previous_state TEXT,
      undo_window_expires_at TIMESTAMPTZ,
      undone_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const adminCount = await db.prepare('SELECT COUNT(*) as c FROM admins').get();
  if (parseInt(adminCount.c, 10) === 0) {
    console.log('[setup] Empty DB detected — running seed...');
    await seed();
    console.log('[setup] Seed complete.');
  }
}

module.exports = setup;
