const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const { readEnv } = require('../config/env');

const config = readEnv();
const dbPath = config.databasePath;
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'ADMIN',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'CREATOR',
    bio TEXT,
    location TEXT,
    profile_slug TEXT UNIQUE NOT NULL,
    social_links TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS creator_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL REFERENCES creators(id),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_approved INTEGER DEFAULT 1,
    is_suspended INTEGER DEFAULT 0,
    suspension_reason TEXT,
    email_verified_at TEXT,
    status_changed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL REFERENCES creators(id),
    content_type TEXT NOT NULL CHECK(content_type IN ('article','video_embed','image_story')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    media_url TEXT NOT NULL,
    order_priority INTEGER DEFAULT 0,
    is_published INTEGER DEFAULT 0,
    published_at TEXT,
    feed_rank_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL REFERENCES creators(id),
    title TEXT NOT NULL,
    role_type TEXT,
    body TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    is_published INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS moderation_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    title_or_name TEXT,
    submitted_by TEXT,
    report_count INTEGER DEFAULT 0,
    assigned_admin TEXT,
    entity_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    actor TEXT,
    target TEXT,
    before_snapshot TEXT,
    after_snapshot TEXT,
    reason TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some((item) => item.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('content', 'campaign_goal', 'TEXT');
ensureColumn('content', 'call_to_action', 'TEXT');
ensureColumn('content', 'target_creator_profile', 'TEXT');

// Dev-friendly auto-seed when database is empty.
try {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  if (adminCount === 0) {
    const adminHash = bcrypt.hashSync('Internet2026@', 10);
    db.prepare(`INSERT INTO admins (email, password_hash) VALUES (?, ?)`)
      .run('admin@plxyground.local', adminHash);

    const userHash = bcrypt.hashSync('Password1!', 10);
    const nike = db.prepare(`INSERT INTO creators (name, role, bio, location, profile_slug) VALUES (?, ?, ?, ?, ?)`)
      .run('Nike', 'BUSINESS', 'Just Do It.', 'Global', 'nike');
    db.prepare(`INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)`)
      .run(nike.lastInsertRowid, 'nike@plxyground.local', userHash);
  }
} catch (e) {
  console.error('Auto-seed failed', e);
}

module.exports = db;
