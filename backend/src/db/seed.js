'use strict';
const bcrypt = require('bcryptjs');
const db = require('./client');
const logger = require('../logger');
const { slugify } = require('../utils/slugify');

function seedDatabase() {
  const hash = bcrypt.hashSync('Admin1234!', 12);
  db.prepare('INSERT OR IGNORE INTO admins (email, password_hash) VALUES (?, ?)').run('admin@plxyground.com', hash);

  const creatorHash = bcrypt.hashSync('Creator1234!', 12);
  const slug = slugify('Jordan Hoops');
  const creator = db.prepare(
    'INSERT OR IGNORE INTO creators (username, slug, display_name, bio, sport, location) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('jordan_hoops', slug, 'Jordan Hoops', 'Basketball content creator from NYC.', 'Basketball', 'New York, NY');

  if (creator.changes > 0) {
    const c = db.prepare('SELECT id FROM creators WHERE username = ?').get('jordan_hoops');
    db.prepare(
      'INSERT OR IGNORE INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)'
    ).run(c.id, 'jordan@plxyground.com', creatorHash);

    db.prepare(
      `INSERT INTO content (creator_id, title, body, media_type, tags, status) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(c.id, 'First Dunk of the Season', 'Caught this on camera during warmups. Pure elevation.', 'none', JSON.stringify(['basketball', 'dunk']), 'published');

    db.prepare(
      `INSERT INTO content (creator_id, title, body, media_type, tags, status) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(c.id, 'Training Routine Breakdown', 'Here is how I structure my morning practice sessions.', 'none', JSON.stringify(['training', 'routine']), 'pending');
  }

  const bizHash = bcrypt.hashSync('Business1234!', 12);
  const bizSlug = slugify('Nike Sports');
  db.prepare(
    'INSERT OR IGNORE INTO businesses (email, password_hash, company_name, slug, industry, location) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('nike@plxyground.com', bizHash, 'Nike Sports', bizSlug, 'Sportswear', 'Portland, OR');

  const biz = db.prepare('SELECT id FROM businesses WHERE slug = ?').get(bizSlug);
  if (biz) {
    db.prepare(
      `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run('business', biz.id, 'Basketball Content Creator Wanted', 'Looking for a high-energy creator to showcase our new basketball shoe line.', 'Basketball', 'Remote', '$500-$1000', '2025-12-31');
  }

  logger.info('Seed data inserted.');
}

module.exports = { seedDatabase };
