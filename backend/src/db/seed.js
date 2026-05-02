'use strict';
const bcrypt = require('bcryptjs');
const logger = require('../logger');

async function autoSeed(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS cnt FROM admins');
  if (rows[0].cnt > 0) return;

  logger.info('Seeding database with initial data...');

  const ROUNDS = 12;
  const adminHash = await bcrypt.hash('Internet2026@', ROUNDS);
  const userHash = await bcrypt.hash('Password1!', ROUNDS);

  // Admin
  await client.query(
    'INSERT INTO admins (email, password_hash) VALUES ($1, $2)',
    ['admin@plxyground.local', adminHash]
  );

  // Creators
  const creators = [
    { username: 'jordan_hoops', slug: 'jordan-hoops', display_name: 'Jordan Hayes', bio: 'Pro basketball player. 3x state champion. Living for the game.', sport: 'Basketball', location: 'Chicago, IL' },
    { username: 'felix_pitch', slug: 'felix-pitch', display_name: 'Felix Rodriguez', bio: 'Football midfielder. UEFA youth academy alumni. Content creator.', sport: 'Football', location: 'Madrid, Spain' },
    { username: 'serena_ace', slug: 'serena-ace', display_name: 'Serena Okafor', bio: 'Tennis coach and competitive player. Grand slam dreams.', sport: 'Tennis', location: 'London, UK' },
    { username: 'dash_lewis', slug: 'dash-lewis', display_name: 'Dashiell Lewis', bio: '400m specialist. Olympic hopeful. Training diaries and race breakdowns.', sport: 'Athletics', location: 'Kingston, Jamaica' },
    { username: 'kofi_box', slug: 'kofi-box', display_name: 'Kofi Mensah', bio: 'Amateur heavyweight boxer. Gym life. Fighting for a title shot.', sport: 'Boxing', location: 'Accra, Ghana' },
  ];

  const creatorIds = [];
  for (const c of creators) {
    const res = await client.query(
      'INSERT INTO creators (username, slug, display_name, bio, sport, location) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [c.username, c.slug, c.display_name, c.bio, c.sport, c.location]
    );
    const creatorId = res.rows[0].id;
    creatorIds.push(creatorId);
    await client.query(
      'INSERT INTO creator_accounts (creator_id, email, password_hash, is_email_verified) VALUES ($1,$2,$3,$4)',
      [creatorId, `${c.username}@plxyground.local`, userHash, true]
    );
  }

  // Businesses
  const businesses = [
    { email: 'nike_sports@plxyground.local', company_name: 'Nike Sports', slug: 'nike-sports', bio: 'Iconic sports brand empowering athletes worldwide.', industry: 'Sports', website: 'https://nike.com', location: 'Beaverton, OR' },
    { email: 'primal_apparel@plxyground.local', company_name: 'Primal Apparel', slug: 'primal-apparel', bio: 'Performance apparel for serious athletes.', industry: 'Apparel', website: 'https://primalapparel.com', location: 'Austin, TX' },
    { email: 'surge_energy@plxyground.local', company_name: 'Surge Energy', slug: 'surge-energy', bio: 'Clean energy drinks formulated for peak performance.', industry: 'Nutrition', website: 'https://surgeenergy.com', location: 'Miami, FL' },
  ];

  const bizIds = [];
  for (const b of businesses) {
    const res = await client.query(
      'INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location, is_email_verified) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
      [b.email, userHash, b.company_name, b.slug, b.bio, b.industry, b.website, b.location, true]
    );
    bizIds.push(res.rows[0].id);
  }

  // Creator content (7 published, 3 pending)
  const contentItems = [
    { idx: 0, title: 'My Pre-Game Routine That Changed Everything', body: 'Three hours before tip-off I visualise every play. Here is the full breakdown of my mental warm-up...', status: 'published' },
    { idx: 1, title: 'Breaking Down the False 9 Position', body: 'Everyone talks about the false 9 but few really understand the off-ball movement required...', status: 'published' },
    { idx: 2, title: 'Serve Mechanics: Tossing the Ball Correctly', body: 'Your serve starts before you even swing the racket. The toss angle determines everything...', status: 'published' },
    { idx: 3, title: 'How I Dropped 0.3 Seconds Off My 400m', body: 'Split times don\'t lie. I analysed six months of training data to pinpoint exactly where I was losing time...', status: 'published' },
    { idx: 4, title: 'The Jab Is Your Best Friend — Here Is Why', body: 'Every elite boxer will tell you the same thing. The jab sets up everything. Distance, rhythm, combinations...', status: 'published' },
    { idx: 0, title: 'Summer Training Camp Highlights', body: 'Week one in the books. Conditioning was brutal but the team chemistry is already building...', status: 'published' },
    { idx: 1, title: 'Match Day Nutrition: What I Actually Eat', body: 'People always ask about the pre-match meal. Here is the exact plan my nutritionist put together...', status: 'published' },
    { idx: 2, title: 'New Racket Review — First Impressions', body: 'Switched to a new frame this month. Here are my honest thoughts after two weeks of hitting...', status: 'pending' },
    { idx: 3, title: 'Race Analysis: Regional Championships', body: 'My splits from the regional championships and what I would do differently next time...', status: 'pending' },
    { idx: 4, title: 'Sparring Session Breakdown', body: 'Three rounds with a southpaw. Here is what I learned about defending the right hand...', status: 'pending' },
  ];

  for (const item of contentItems) {
    const res = await client.query(
      'INSERT INTO content (creator_id, title, body, status) VALUES ($1,$2,$3,$4) RETURNING id',
      [creatorIds[item.idx], item.title, item.body, item.status]
    );
    if (item.status === 'pending') {
      await client.query(
        'INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)',
        ['creator_content', res.rows[0].id]
      );
    }
  }

  // Business content (2 published, 1 pending)
  const bizContent = [
    { idx: 0, title: 'Air Max Pro Launch — Creator Partnership Open', body: 'We are looking for authentic sports creators to showcase the new Air Max Pro collection.', budget_range: '$500-$2000', target_sport: 'Basketball', status: 'published' },
    { idx: 1, title: 'Primal AW26 Campaign — Athlete Ambassadors Wanted', body: 'Seeking performance athletes for our Autumn/Winter 2026 campaign shoot in Austin.', budget_range: '$1000-$5000', target_sport: 'Athletics', status: 'published' },
    { idx: 2, title: 'Surge Zero Launch Partnership', body: 'New zero-sugar formula dropping in Q3. Looking for energetic creators across all sports.', budget_range: '$300-$1500', target_sport: null, status: 'pending' },
  ];

  for (const bc of bizContent) {
    const res = await client.query(
      'INSERT INTO business_content (business_id, title, body, budget_range, target_sport, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [bizIds[bc.idx], bc.title, bc.body, bc.budget_range, bc.target_sport, bc.status]
    );
    if (bc.status === 'pending') {
      await client.query(
        'INSERT INTO moderation_queue (content_type, content_id) VALUES ($1,$2)',
        ['business_content', res.rows[0].id]
      );
    }
  }

  // Opportunities (5 total)
  const opps = [
    { type: 'creator', id_idx: 0, title: 'Basketball Training Camp Content Creator Needed', description: 'Looking for a skilled content creator to document our elite youth basketball training camp this summer.', sport: 'Basketball', location: 'Chicago, IL', budget: '$800', deadline: '2026-06-30' },
    { type: 'business', id_idx: 0, title: 'Nike Sports Creator Ambassador Programme 2026', description: 'Join our global creator ambassador programme. Flexible content schedule, product gifting and performance bonuses.', sport: null, location: 'Remote', budget: 'Negotiable', deadline: '2026-07-15' },
    { type: 'creator', id_idx: 2, title: 'Tennis Coaching Series — Co-Creator Wanted', description: 'Partnering with another tennis creator to produce a 12-episode coaching series covering serves, volleys and match strategy.', sport: 'Tennis', location: 'London, UK', budget: 'Revenue share', deadline: '2026-05-31' },
    { type: 'business', id_idx: 1, title: 'Primal Apparel Athlete Photography Day', description: 'Seeking 5-10 athletes across any sport for a full-day product photography shoot. All sports welcome.', sport: null, location: 'Austin, TX', budget: '$250 per athlete', deadline: '2026-06-10' },
    { type: 'creator', id_idx: 3, title: 'Athletics Podcast — Guest Appearances Open', description: 'Running a weekly athletics podcast and looking for guest athletes to discuss training, mindset and competition.', sport: 'Athletics', location: 'Remote', budget: 'Unpaid / exposure', deadline: '2026-12-31' },
  ];

  for (const opp of opps) {
    const posterId = opp.type === 'creator' ? creatorIds[opp.id_idx] : bizIds[opp.id_idx];
    await client.query(
      'INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [opp.type, posterId, opp.title, opp.description, opp.sport, opp.location, opp.budget, opp.deadline]
    );
  }

  logger.info('Seed data inserted successfully.');
}

module.exports = { autoSeed };
