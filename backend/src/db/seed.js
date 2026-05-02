'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./client');
const logger = require('../logger');

async function run() {
  logger.info('[seed] Starting seed...');

  const adminHash = await bcrypt.hash('Internet2026@', 12);
  await pool.query(
    'INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
    ['admin@plxyground.local', adminHash]
  );

  const userHash = await bcrypt.hash('Password1!', 12);

  const creatorsData = [
    { username: 'jayden_hoops', display_name: 'Jayden Hoops', sport: 'Basketball', location: 'London, UK', bio: 'Point guard turning heads in the EBL. Living for the game.' },
    { username: 'tomfs11', display_name: 'Tom Freeman', sport: 'Football', location: 'Manchester, UK', bio: 'Semi-pro winger. FA Youth Cup alumni. Chasing the dream.' },
    { username: 'serena_ace', display_name: 'Serena Ace', sport: 'Tennis', location: 'Birmingham, UK', bio: 'LTA-rated player. Training full-time. Racket in hand since age 6.' },
    { username: 'sprint_king_marcus', display_name: 'Marcus Adeyemi', sport: 'Athletics', location: 'Bristol, UK', bio: '100m specialist. PB 10.41. Targeting British Championships.' },
    { username: 'dexter_boxing', display_name: 'Dexter Cole', sport: 'Boxing', location: 'Leeds, UK', bio: 'Super-featherweight. 12-2 amateur record. Turning pro next year.' },
  ];

  const creatorIds = [];
  for (const c of creatorsData) {
    const slug = c.username.replace(/_/g, '-');
    const res = await pool.query(
      `INSERT INTO creators (username, slug, display_name, bio, sport, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id`,
      [c.username, slug, c.display_name, c.bio, c.sport, c.location]
    );
    const creatorId = res.rows[0].id;
    creatorIds.push(creatorId);
    const email = `${c.username}@plxyground.local`;
    await pool.query(
      `INSERT INTO creator_accounts (creator_id, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [creatorId, email, userHash]
    );
  }

  const businessesData = [
    { company_name: 'ProSport Gear', email: 'hello@prosportgear.local', industry: 'Sports', location: 'London, UK', bio: 'The UK\'s fastest-growing sports equipment brand.', website: 'https://prosportgear.local' },
    { company_name: 'Apex Apparel', email: 'hello@apexapparel.local', industry: 'Apparel', location: 'Manchester, UK', bio: 'Performance wear built for elite athletes.', website: 'https://apexapparel.local' },
    { company_name: 'Volt Energy', email: 'hello@voltenergy.local', industry: 'Nutrition', location: 'Bristol, UK', bio: 'Clean energy drinks for serious athletes.', website: 'https://voltenergy.local' },
  ];

  const businessIds = [];
  for (const b of businessesData) {
    const slug = b.company_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const res = await pool.query(
      `INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET company_name = EXCLUDED.company_name
       RETURNING id`,
      [b.email, userHash, b.company_name, slug, b.bio, b.industry, b.website, b.location]
    );
    businessIds.push(res.rows[0].id);
  }

  const contentItems = [
    { idx: 0, title: 'My Journey to the EBL', body: 'Three years ago I was playing street ball in Hackney. Now I suit up for the English Basketball League. Here\'s the full story.', status: 'published', tags: '["basketball","journey"]' },
    { idx: 0, title: 'Post-Game Recovery Routine', body: 'Ice baths, stretching, and sleep. The boring stuff nobody talks about.', status: 'published', tags: '["recovery","fitness"]' },
    { idx: 1, title: 'Surviving a Pro Trial', body: 'I had a 3-day trial at a Championship club. Here\'s what it was really like.', status: 'published', tags: '["football","trial"]' },
    { idx: 1, title: 'Speed Work in Pre-Season', body: 'The drills that added 2km/h to my sprint. Resistance bands and sprint ladders — full session breakdown.', status: 'published', tags: '["training","speed"]' },
    { idx: 2, title: 'Serving Under Pressure', body: 'My mental checklist before every serve. Breathe. Bounce. See the ball.', status: 'published', tags: '["tennis","mindset"]' },
    { idx: 2, title: 'Breaking Down My Backhand', body: 'Video analysis of my backhand improvement over 12 months. Coach approved.', status: 'published', tags: '["tennis","technique"]' },
    { idx: 3, title: 'How I Got My 100m PB', body: 'Race breakdown: start, drive phase, top speed, and the lean at the line.', status: 'published', tags: '["athletics","sprinting"]' },
    { idx: 4, title: 'Training Camp: Week 1', body: 'Six sessions in five days. Body is broken. But I\'m grinning.', status: 'pending', tags: '["boxing","training"]' },
    { idx: 3, title: 'Nutrition for Sprint Athletes', body: 'What I eat in a day during peak training block. High carb, high protein.', status: 'pending', tags: '["nutrition","athletics"]' },
    { idx: 1, title: 'Injury Recovery: ACL to Comeback', body: 'Six months out. The mental battle was harder than the physical one.', status: 'pending', tags: '["football","injury"]' },
  ];

  for (const item of contentItems) {
    const cId = creatorIds[item.idx];
    const res = await pool.query(
      `INSERT INTO content (creator_id, title, body, status, tags)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id`,
      [cId, item.title, item.body, item.status, item.tags]
    );
    if (item.status === 'pending') {
      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`,
        [res.rows[0].id]
      );
    }
  }

  const businessContent = [
    { idx: 0, title: 'Seeking Basketball Creators for Product Launch', body: 'We are launching a new basketball training kit and need authentic creators to review it.', budget_range: '\u00a3500-\u00a32k', target_sport: 'Basketball', status: 'published' },
    { idx: 1, title: 'Athletes Wanted for Spring/Summer Campaign', body: 'Apex Apparel is casting for our Spring/Summer 2026 campaign. All sports considered.', budget_range: '\u00a32k-\u00a310k', target_sport: null, status: 'published' },
    { idx: 2, title: 'Volt Energy — Brand Ambassador Programme', body: 'We are building our ambassador roster. Looking for high-performance athletes in any discipline.', budget_range: '\u00a3500-\u00a32k', target_sport: null, status: 'pending' },
  ];

  for (const bc of businessContent) {
    const bId = businessIds[bc.idx];
    const res = await pool.query(
      `INSERT INTO business_content (business_id, title, body, budget_range, target_sport, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [bId, bc.title, bc.body, bc.budget_range, bc.target_sport, bc.status]
    );
    if (bc.status === 'pending') {
      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)`,
        [res.rows[0].id]
      );
    }
  }

  const opps = [
    { type: 'business', idx: 0, title: 'Brand Ambassador — Basketball', description: 'ProSport Gear is looking for a basketball creator to become the face of our new training range. Must have 1k+ followers.', sport: 'Basketball', location: 'London, UK', budget: '\u00a3300/month', deadline: '2026-06-30' },
    { type: 'business', idx: 1, title: 'Spring Campaign Model', description: 'Apex Apparel needs athletes for a 2-day photo shoot in Manchester. All sports welcome.', sport: null, location: 'Manchester, UK', budget: '\u00a3500 flat fee', deadline: '2026-05-15' },
    { type: 'creator', idx: 0, title: 'Looking for Training Partner — Basketball London', description: 'Point guard looking for regular training partner. Sessions 3x per week in Hackney.', sport: 'Basketball', location: 'London, UK', budget: null, deadline: null },
    { type: 'creator', idx: 2, title: 'Tennis Hitting Partner Wanted', description: 'LTA-rated player seeking consistent hitting partner at Edgbaston Priory or nearby club.', sport: 'Tennis', location: 'Birmingham, UK', budget: null, deadline: null },
    { type: 'business', idx: 2, title: 'Volt Energy — Content Creator Partnership', description: 'We want authentic athletes to document their training journeys while using Volt Energy products.', sport: null, location: 'Remote/UK', budget: '\u00a3150/month + product', deadline: '2026-07-01' },
  ];

  for (const opp of opps) {
    let postedById;
    if (opp.type === 'business') {
      postedById = businessIds[opp.idx];
    } else {
      postedById = creatorIds[opp.idx];
    }
    await pool.query(
      `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [opp.type, postedById, opp.title, opp.description, opp.sport, opp.location, opp.budget, opp.deadline]
    );
  }

  logger.info('[seed] Seed complete.');
}

// Allow running directly: node src/db/seed.js
if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('[seed] Seed failed', { message: err.message });
      process.exit(1);
    });
}

module.exports = { run };
