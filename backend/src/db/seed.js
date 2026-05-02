'use strict';

const bcrypt = require('bcryptjs');
const { getPool } = require('./client');
const logger = require('../logger');

const BCRYPT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Password1!';
const ADMIN_PASSWORD = 'Internet2026@';

async function run(pool) {
  if (!pool) pool = getPool();

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  await pool.query(
    `INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
    ['admin@plxyground.local', adminHash]
  );

  const userHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  const creatorsData = [
    { username: 'jordanhoops', display_name: 'Jordan Mitchell', sport: 'Basketball', location: 'London, UK', bio: 'Professional basketball player and content creator. Sharing my journey from the streets of London to the court.' },
    { username: 'tomfootie', display_name: 'Tom Clarke', sport: 'Football', location: 'Manchester, UK', bio: 'Semi-pro footballer documenting the grind. Training clips, match highlights, and behind-the-scenes from the beautiful game.' },
    { username: 'aceserve', display_name: 'Priya Sharma', sport: 'Tennis', location: 'Birmingham, UK', bio: 'Tennis coach and competitive player. Helping the next generation find their swing. LTA accredited.' },
    { username: 'sprintking', display_name: 'Marcus Osei', sport: 'Athletics', location: 'Bristol, UK', bio: 'Sprinter chasing national records. 100m specialist. Follow my training journey with Team GB ambitions.' },
    { username: 'ironjab', display_name: 'Danny Walsh', sport: 'Boxing', location: 'Leeds, UK', bio: 'Amateur boxer, two-time regional champion. Documenting the grind, the gym life, and the sweet science.' },
  ];

  const creatorIds = [];
  for (const c of creatorsData) {
    const slug = c.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const { rows } = await pool.query(
      `INSERT INTO creators (username, slug, display_name, bio, sport, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id`,
      [c.username, slug, c.display_name, c.bio, c.sport, c.location]
    );
    const creatorId = rows[0].id;
    creatorIds.push(creatorId);
    const email = `${c.username}@plxyground.local`;
    await pool.query(
      `INSERT INTO creator_accounts (creator_id, email, password_hash, is_email_verified)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email) DO NOTHING`,
      [creatorId, email, userHash]
    );
  }

  const businessesData = [
    { company_name: 'ProSport UK', slug: 'prosport-uk', email: 'hello@prosport-uk.local', industry: 'Sports', bio: 'The UK's leading sports equipment brand. Equipping athletes from grassroots to elite.', website: 'https://prosport-uk.example.com', location: 'London, UK' },
    { company_name: 'Kinetic Apparel', slug: 'kinetic-apparel', email: 'hello@kineticapparel.local', industry: 'Apparel', bio: 'Performance sportswear designed for athletes who refuse to slow down. Built for the bold.', website: 'https://kineticapparel.example.com', location: 'Manchester, UK' },
    { company_name: 'Surge Energy', slug: 'surge-energy', email: 'hello@surgeenergy.local', industry: 'Nutrition', bio: 'Fuel your performance with Surge. Natural energy drinks crafted for serious athletes.', website: 'https://surgeenergy.example.com', location: 'Bristol, UK' },
  ];

  const businessIds = [];
  for (const b of businessesData) {
    const { rows } = await pool.query(
      `INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location, is_email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (email) DO UPDATE SET company_name = EXCLUDED.company_name
       RETURNING id`,
      [b.email, userHash, b.company_name, b.slug, b.bio, b.industry, b.website, b.location]
    );
    businessIds.push(rows[0].id);
  }

  const contentData = [
    { creator_id: creatorIds[0], title: 'My first 1000 training hours', body: 'They say it takes 10,000 hours to master a skill. Here\'s what I learned in my first 1,000 hours of serious basketball training.', status: 'published', tags: ['basketball', 'training'] },
    { creator_id: creatorIds[0], title: 'How I improved my three-point percentage by 20%', body: 'Consistent arc, footwork, and mental rehearsal. These are the three pillars that transformed my shooting this season.', status: 'published', tags: ['basketball', 'shooting'] },
    { creator_id: creatorIds[1], title: 'Pre-season training with my squad', body: 'Back on the pitch after summer break. Pre-season is brutal but necessary — here\'s the full week breakdown.', status: 'published', tags: ['football', 'preseason'] },
    { creator_id: creatorIds[1], title: 'My favourite drills for improving first touch', body: 'First touch is the difference between a good player and a great one. Five drills I do every session.', status: 'published', tags: ['football', 'technique'] },
    { creator_id: creatorIds[2], title: 'Coaching beginners: the 5 fundamentals', body: 'Before you work on power or spin, every beginner needs to nail these five fundamentals. Here\'s my approach.', status: 'published', tags: ['tennis', 'coaching'] },
    { creator_id: creatorIds[3], title: 'Breaking the 11-second barrier', body: 'Running sub-11 seconds in the 100m felt impossible six months ago. Here\'s the training block that got me there.', status: 'published', tags: ['athletics', 'sprinting'] },
    { creator_id: creatorIds[4], title: 'A week in the life of an amateur boxer', body: 'Monday to Sunday — roadwork, bag sessions, sparring, recovery, and the mental side nobody talks about.', status: 'published', tags: ['boxing', 'lifestyle'] },
    { creator_id: creatorIds[0], title: 'Upcoming tournament prep', body: 'Heading into the regional championship next month. Sharing my preparation plan and mindset going in.', status: 'pending', tags: ['basketball', 'tournament'] },
    { creator_id: creatorIds[2], title: 'New racket review', body: 'I\'ve been testing the Wilson Blade 98 for the past 8 weeks. Here are my honest thoughts.', status: 'pending', tags: ['tennis', 'gear'] },
    { creator_id: creatorIds[3], title: 'Recovery protocol after a hard sprint session', body: 'Post-session recovery is where gains are made. Here\'s my exact protocol: ice bath, nutrition, and sleep hygiene.', status: 'pending', tags: ['athletics', 'recovery'] },
  ];

  for (const c of contentData) {
    const { rows } = await pool.query(
      `INSERT INTO content (creator_id, title, body, status, tags) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [c.creator_id, c.title, c.body, c.status, JSON.stringify(c.tags)]
    );
    if (c.status === 'pending') {
      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`,
        [rows[0].id]
      );
    }
  }

  const bizContentData = [
    { business_id: businessIds[0], title: 'Seeking Basketball Content Creators for Q3 Campaign', body: 'ProSport UK is looking for passionate basketball content creators to feature our new training range.', budget_range: '£500-£2k', target_sport: 'Basketball', status: 'published' },
    { business_id: businessIds[1], title: 'Kinetic Apparel Spring Collection — Athlete Ambassadors', body: 'We are building our ambassador roster for 2026. Looking for creators across all sports with an engaged audience.', budget_range: '£2k-£10k', target_sport: null, status: 'published' },
    { business_id: businessIds[2], title: 'Surge Energy — Pre-Workout Review Series', body: 'Looking for nutrition-conscious athletes to review our new pre-workout formula. Sample boxes provided.', budget_range: 'Under £500', target_sport: null, status: 'pending' },
  ];

  for (const bc of bizContentData) {
    const { rows } = await pool.query(
      `INSERT INTO business_content (business_id, title, body, budget_range, target_sport, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [bc.business_id, bc.title, bc.body, bc.budget_range, bc.target_sport, bc.status]
    );
    if (bc.status === 'pending') {
      await pool.query(
        `INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)`,
        [rows[0].id]
      );
    }
  }

  const opportunitiesData = [
    { posted_by_type: 'business', posted_by_id: businessIds[0], title: 'Product Launch Video Creator Needed', description: 'We need a sports content creator to film a 60-second product launch video for our new basketball shoe. Must be based in London or willing to travel.', sport: 'Basketball', location: 'London, UK', budget: '£800', deadline: '2026-06-30' },
    { posted_by_type: 'business', posted_by_id: businessIds[1], title: 'Brand Ambassador — Long Term Partnership', description: 'Kinetic Apparel is offering a 12-month ambassador deal to the right athlete-creator. Includes kit allowance, fee per post, and event appearances.', sport: null, location: 'Remote', budget: '£10,000/year', deadline: '2026-07-15' },
    { posted_by_type: 'creator', posted_by_id: creatorIds[0], title: 'Looking for Collab — Basketball Creators London', description: 'London-based basketball creator looking to collab with other creators for cross-posting, joint training videos, and community building.', sport: 'Basketball', location: 'London, UK', budget: 'Revenue share', deadline: '2026-05-31' },
    { posted_by_type: 'creator', posted_by_id: creatorIds[3], title: 'Sprinting Coach Opportunity', description: 'I am available for 1-on-1 online sprint coaching sessions. Targeting serious amateur athletes who want to improve their 100m time.', sport: 'Athletics', location: 'Online', budget: '£60/session', deadline: '2026-12-31' },
    { posted_by_type: 'business', posted_by_id: businessIds[2], title: 'Athletes Wanted — Energy Drink Taste Test Campaign', description: 'We are recruiting 10 athletes across all sports to participate in a filmed taste test and social campaign for Surge Energy\'s new flavour launch.', sport: null, location: 'Manchester, UK', budget: '£200 + product', deadline: '2026-06-15' },
  ];

  for (const o of opportunitiesData) {
    await pool.query(
      `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [o.posted_by_type, o.posted_by_id, o.title, o.description, o.sport, o.location, o.budget, o.deadline]
    );
  }

  logger.info('Seed data inserted successfully');
}

if (require.main === module) {
  require('dotenv').config();
  run().then(() => process.exit(0)).catch((err) => {
    logger.error('Seed failed', { message: err.message });
    process.exit(1);
  });
}

module.exports = { run };
