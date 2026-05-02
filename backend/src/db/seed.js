'use strict';

const bcrypt = require('bcrypt');
const pool = require('./client');
const logger = require('../logger');

const BCRYPT_ROUNDS = 12;

async function seed() {
  logger.info('Seeding database...');

  // Admin
  const adminHash = await bcrypt.hash('Admin@plxyground1', BCRYPT_ROUNDS);
  await pool.query(
    'INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
    ['admin@plxyground.com', adminHash]
  );

  // Creators
  const creators = [
    { name: 'Jordan Miles',   slug: 'jordan-miles',   sport: 'basketball', bio: 'NBA content creator', followers: 24500 },
    { name: 'Serena Blake',   slug: 'serena-blake',   sport: 'tennis',     bio: 'Tennis tips & drills', followers: 18200 },
    { name: 'Marcus Webb',    slug: 'marcus-webb',    sport: 'football',   bio: 'Football analyst',    followers: 31000 },
    { name: 'Priya Sharma',   slug: 'priya-sharma',   sport: 'cricket',    bio: 'Cricket highlights',  followers: 9800  },
    { name: 'Luca Ferretti',  slug: 'luca-ferretti',  sport: 'athletics',  bio: 'Sprint & track',      followers: 7600  },
  ];

  for (const c of creators) {
    const { rows } = await pool.query(
      `INSERT INTO creators (name, slug, sport, bio, follower_count)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [c.name, c.slug, c.sport, c.bio, c.followers]
    );
    const creatorId = rows[0].id;
    const hash = await bcrypt.hash('Creator@plxy1', BCRYPT_ROUNDS);
    await pool.query(
      `INSERT INTO creator_accounts (creator_id, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [creatorId, `${c.slug}@plxyground.com`, hash]
    );
  }

  // Businesses
  const businesses = [
    { name: 'NikeX',         email: 'nikex@plxyground.com',    website: 'https://nike.com',    bio: 'Sports apparel giant' },
    { name: 'SportRadar',    email: 'sportradar@plxyground.com', website: 'https://sportradar.com', bio: 'Sports data & analytics' },
    { name: 'Lucozade Sport', email: 'lucozade@plxyground.com', website: 'https://lucozade.com', bio: 'Sports nutrition brand' },
  ];

  for (const b of businesses) {
    const hash = await bcrypt.hash('Business@plxy1', BCRYPT_ROUNDS);
    await pool.query(
      `INSERT INTO businesses (name, email, password_hash, website, bio)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [b.name, b.email, hash, b.website, b.bio]
    );
  }

  // Seed content (10 posts, all published)
  const { rows: creatorRows } = await pool.query('SELECT id, slug FROM creators LIMIT 5');
  const contentSeeds = [
    'Top 5 crossover drills to improve your handle',
    'Why serve placement matters more than power',
    'Breaking down the 4-3-3 defensive shape',
    'How I trained for my first half-marathon',
    'Cricket batting footwork fundamentals',
    'Building explosive speed off the blocks',
    'Mental resilience in high-pressure games',
    'Recovery tips every athlete needs to know',
    'Film study: reading a defence before the snap',
    'Nutrition timing around training sessions',
  ];

  for (let i = 0; i < contentSeeds.length; i++) {
    const creator = creatorRows[i % creatorRows.length];
    const { rows: contentRows } = await pool.query(
      `INSERT INTO content (creator_id, title, body, status)
       VALUES ($1, $2, $3, 'published')
       RETURNING id`,
      [creator.id, contentSeeds[i], `Full breakdown of: ${contentSeeds[i]}. Lorem ipsum placeholder body text.`]
    );
    await pool.query(
      `INSERT INTO moderation_queue (content_type, content_id, status)
       VALUES ('content', $1, 'approved')`,
      [contentRows[0].id]
    );
  }

  // Opportunities (5)
  const oppSeeds = [
    { title: 'Basketball Content Deal', desc: 'Seeking NBA-focused creators for sponsored reels.', sport: 'basketball', pay: 1500 },
    { title: 'Tennis Academy Partner',  desc: 'Promote our academies across the UK.',             sport: 'tennis',     pay: 800  },
    { title: 'Football Kit Review',     desc: 'Review our new kit range for 2026 season.',        sport: 'football',   pay: 600  },
    { title: 'Sports Nutrition Brand',  desc: 'Ambassador programme for certified athletes.',     sport: null,         pay: 1200 },
    { title: 'Athletics Sponsorship',   desc: 'Looking for track athletes with 10k+ followers.',  sport: 'athletics',  pay: 950  },
  ];

  const { rows: bizRows } = await pool.query('SELECT id FROM businesses LIMIT 3');
  for (let i = 0; i < oppSeeds.length; i++) {
    const biz = bizRows[i % bizRows.length];
    await pool.query(
      `INSERT INTO opportunities (posted_by, poster_id, title, description, sport, pay)
       VALUES ('business', $1, $2, $3, $4, $5)`,
      [biz.id, oppSeeds[i].title, oppSeeds[i].desc, oppSeeds[i].sport, oppSeeds[i].pay]
    );
  }

  logger.info('Seed complete.');
}

module.exports = seed;
