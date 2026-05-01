const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { readEnv } = require('../config/env');

const config = readEnv();
const connectionString = config.databaseUrl;

const pool = new Pool({
  connectionString,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
});

function normalizeValue(value) {
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) {
      return parsed;
    }
  }
  return value;
}

function normalizeRow(row) {
  if (!row) return row;
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]));
}

function normalizeRows(rows) {
  return rows.map(normalizeRow);
}

function translateSql(sql) {
  let index = 0;
  return sql
    .replace(/\?/g, () => `$${++index}`)
    .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP');
}

function buildRunSql(sql) {
  const translated = translateSql(sql);
  if (/^\s*insert\s+/i.test(translated) && !/\breturning\b/i.test(translated)) {
    return `${translated} RETURNING id`;
  }
  return translated;
}

async function rawQuery(text, params = []) {
  return pool.query(text, params);
}

async function query(text, params = []) {
  await ready;
  return rawQuery(text, params);
}

function createPrepared(sql, runner) {
  return {
    get: async (...params) => {
      const result = await runner(translateSql(sql), params);
      return normalizeRow(result.rows[0]);
    },
    all: async (...params) => {
      const result = await runner(translateSql(sql), params);
      return normalizeRows(result.rows);
    },
    run: async (...params) => {
      const result = await runner(buildRunSql(sql), params);
      const firstRow = normalizeRow(result.rows[0]);
      return {
        changes: result.rowCount || 0,
        lastInsertRowid: firstRow?.id,
      };
    },
  };
}

function prepare(sql) {
  return createPrepared(sql, query);
}

function bootstrapPrepare(sql) {
  return createPrepared(sql, rawQuery);
}

async function exec(sql) {
  await ready;
  return rawQuery(sql);
}

async function initializeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'ADMIN',
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'CREATOR',
      bio TEXT,
      location TEXT,
      profile_slug TEXT UNIQUE NOT NULL,
      social_links TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS creator_accounts (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      creator_id INTEGER NOT NULL REFERENCES creators(id),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_approved INTEGER DEFAULT 1,
      is_suspended INTEGER DEFAULT 0,
      suspension_reason TEXT,
      email_verified_at TIMESTAMPTZ,
      status_changed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      creator_id INTEGER NOT NULL REFERENCES creators(id),
      content_type TEXT NOT NULL CHECK(content_type IN ('article','video_embed','image_story')),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      media_url TEXT NOT NULL,
      order_priority INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 0,
      published_at TIMESTAMPTZ,
      feed_rank_at TIMESTAMPTZ,
      campaign_goal TEXT,
      call_to_action TEXT,
      target_creator_profile TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      creator_id INTEGER NOT NULL REFERENCES creators(id),
      title TEXT NOT NULL,
      role_type TEXT,
      body TEXT NOT NULL,
      requirements TEXT,
      benefits TEXT,
      is_published INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS moderation_queue (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      title_or_name TEXT,
      submitted_by TEXT,
      report_count INTEGER DEFAULT 0,
      assigned_admin TEXT,
      entity_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      action_type TEXT NOT NULL,
      actor TEXT,
      target TEXT,
      before_snapshot TEXT,
      after_snapshot TEXT,
      reason TEXT,
      metadata TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      creator_id INTEGER NOT NULL REFERENCES creators(id),
      token TEXT NOT NULL UNIQUE,
      revoked INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS two_factor_codes (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      creator_id INTEGER NOT NULL REFERENCES creators(id),
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS opportunity_applications (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      opportunity_id INTEGER NOT NULL REFERENCES opportunities(id),
      creator_id INTEGER NOT NULL REFERENCES creators(id),
      status TEXT DEFAULT 'pending',
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bulk_action_log (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      admin TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_ids TEXT NOT NULL,
      previous_state TEXT,
      undo_window_expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      undone_at TIMESTAMPTZ
    );
  `);
}

async function ensureDemoData() {
  const adminExists = await bootstrapPrepare('SELECT id FROM admins WHERE email = ?').get('admin@plxyground.local');
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('Internet2026@', 10);
    await bootstrapPrepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run('admin@plxyground.local', adminHash);
  }

  const userHash = bcrypt.hashSync('Password1!', 10);

  async function ensureDemoAccount({ name, role, bio, location, profileSlug, email }) {
    const existingAccount = await bootstrapPrepare(`
      SELECT ca.id, ca.creator_id
      FROM creator_accounts ca
      WHERE ca.email = ?
    `).get(email);

    if (existingAccount) {
      return bootstrapPrepare('SELECT id, name, role, profile_slug FROM creators WHERE id = ?').get(existingAccount.creator_id);
    }

    const creator = await bootstrapPrepare(`
      INSERT INTO creators (name, role, bio, location, profile_slug)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, role, bio, location, profileSlug);

    await bootstrapPrepare(`
      INSERT INTO creator_accounts (creator_id, email, password_hash)
      VALUES (?, ?, ?)
    `).run(creator.lastInsertRowid, email, userHash);

    return bootstrapPrepare('SELECT id, name, role, profile_slug FROM creators WHERE id = ?').get(creator.lastInsertRowid);
  }

  const sarah = await ensureDemoAccount({
    name: 'Sarah Johnson',
    role: 'CREATOR',
    bio: 'Sports content creator and athlete.',
    location: 'London, UK',
    profileSlug: 'sarahjohnson',
    email: 'sarahjohnson@plxyground.local',
  });

  const mike = await ensureDemoAccount({
    name: 'Mike Thompson',
    role: 'CREATOR',
    bio: 'Basketball coach and writer.',
    location: 'Manchester, UK',
    profileSlug: 'mikethompson',
    email: 'mikethompson@plxyground.local',
  });

  const alex = await ensureDemoAccount({
    name: 'Alex Rivera',
    role: 'CREATOR',
    bio: 'Fitness influencer and personal trainer.',
    location: 'Birmingham, UK',
    profileSlug: 'alexrivera',
    email: 'alexrivera@plxyground.local',
  });

  await ensureDemoAccount({
    name: 'Nike',
    role: 'BUSINESS',
    bio: 'Just Do It.',
    location: 'Global',
    profileSlug: 'nike',
    email: 'nike@plxyground.local',
  });

  await ensureDemoAccount({
    name: 'Adidas',
    role: 'BUSINESS',
    bio: 'Impossible is Nothing.',
    location: 'Global',
    profileSlug: 'adidas',
    email: 'adidas@plxyground.local',
  });

  const mediaUrls = [
    'https://images.unsplash.com/photo-1546519638405-a9f5a95a5b64?w=800',
    'https://images.unsplash.com/photo-1495841674378-c3c9e6f44c00?w=800',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=800',
    'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  ];

  const posts = [
    { creatorId: sarah.id, email: 'sarahjohnson@plxyground.local', contentType: 'article', title: 'My Morning Training Routine', body: 'Every morning I start with a 5km run followed by strength training. The key is consistency - you have to show up even when you do not feel like it. After three years of this routine, I have seen incredible results both mentally and physically.', mediaUrl: mediaUrls[0], isPublished: 1 },
    { creatorId: sarah.id, email: 'sarahjohnson@plxyground.local', contentType: 'image_story', title: 'Track Day Highlights', body: 'What an incredible session on the track today. Personal bests across the board. The team is firing on all cylinders and we are building something special here.', mediaUrl: mediaUrls[1], isPublished: 1 },
    { creatorId: mike.id, email: 'mikethompson@plxyground.local', contentType: 'article', title: 'Breaking Down the Pick and Roll', body: 'The pick and roll is the most versatile play in basketball. Understanding how to execute it as a ball handler and how to defend it as a team is essential at every level of the game. Let me walk you through the fundamentals.', mediaUrl: mediaUrls[2], isPublished: 1 },
    { creatorId: mike.id, email: 'mikethompson@plxyground.local', contentType: 'video_embed', title: 'Coaching Session Highlights', body: 'Yesterday we ran our first full team scrimmage of the season. The progress these players have made in six weeks is remarkable. Full breakdown in this weeks session video.', mediaUrl: mediaUrls[3], isPublished: 0 },
    { creatorId: alex.id, email: 'alexrivera@plxyground.local', contentType: 'article', title: '30-Day Strength Challenge Results', body: 'Thirty days ago I started a strict strength programme with zero equipment - just bodyweight movements and progressive overload. Here are the results and what I learned about consistency, recovery, and mental resilience.', mediaUrl: mediaUrls[4], isPublished: 1 },
    { creatorId: alex.id, email: 'alexrivera@plxyground.local', contentType: 'image_story', title: 'Gym Setup Tour', body: 'Finally finished setting up the home gym. Built it from scratch over six months. Every piece of equipment was chosen with intention. This is where the work happens.', mediaUrl: mediaUrls[5], isPublished: 0 },
    { creatorId: sarah.id, email: 'sarahjohnson@plxyground.local', contentType: 'article', title: 'Nutrition for Athletes: What I Actually Eat', body: 'Forget the complicated meal plans you see online. As a full-time athlete on a budget, my approach to nutrition is simple, repeatable, and effective. High protein, quality carbohydrates around training, and fats from whole food sources.', mediaUrl: mediaUrls[6], isPublished: 1 },
    { creatorId: mike.id, email: 'mikethompson@plxyground.local', contentType: 'article', title: 'Why Defence Wins Championships', body: 'Everyone wants to talk about scoring. But the teams that win consistently - at every level - are built on defensive principles. Rotations, communication, effort on the weak side. Let me show you what elite defence actually looks like.', mediaUrl: mediaUrls[0], isPublished: 0 },
    { creatorId: alex.id, email: 'alexrivera@plxyground.local', contentType: 'video_embed', title: 'Skill Progression Drills for All Levels', body: 'The drills I use with pro-level trainees can be scaled for beginners and elite athletes alike. In this post, I share my top three drills for agility, coordination, and decision-making.', mediaUrl: mediaUrls[1], isPublished: 1 },
    { creatorId: sarah.id, email: 'sarahjohnson@plxyground.local', contentType: 'image_story', title: 'Recovery Day Ritual', body: 'Not every day is high intensity. Recovery is when your body adapts. Here are my favorite stretches, nutrition picks, and mindset practices for rest days.', mediaUrl: mediaUrls[2], isPublished: 0 },
  ];

  for (const post of posts) {
    const existingPost = await bootstrapPrepare('SELECT id FROM content WHERE creator_id = ? AND title = ?').get(post.creatorId, post.title);
    if (existingPost) continue;

    const inserted = await bootstrapPrepare(`
      INSERT INTO content (creator_id, content_type, title, body, media_url, is_published, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      post.creatorId,
      post.contentType,
      post.title,
      post.body,
      post.mediaUrl,
      post.isPublished,
      post.isPublished ? new Date().toISOString() : null
    );

    if (!post.isPublished) {
      const existingQueue = await bootstrapPrepare('SELECT id FROM moderation_queue WHERE type = ? AND entity_id = ?').get('content', inserted.lastInsertRowid);
      if (!existingQueue) {
        await bootstrapPrepare(`
          INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
          VALUES (?, ?, ?, ?, ?)
        `).run('content', 'pending', post.title, post.email, inserted.lastInsertRowid);
      }
    }
  }
}

const ready = (async () => {
  await initializeSchema();
  await ensureDemoData();
})();

module.exports = {
  exec,
  pool,
  prepare,
  query,
  ready,
};
