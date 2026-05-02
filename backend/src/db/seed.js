'use strict';

const bcrypt = require('bcryptjs');
const { getPool } = require('./client');
const logger = require('../logger');

const ADMIN_PASSWORD = 'Internet2026@';
const USER_PASSWORD = 'Password1!';
const SALT_ROUNDS = 12;

async function seed(poolOverride) {
  const pool = poolOverride || getPool();

  logger.info('Seeding database...');

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  const userHash = await bcrypt.hash(USER_PASSWORD, SALT_ROUNDS);

  // Admin
  const { rows: [admin] } = await pool.query(
    `INSERT INTO admins (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    ['admin@plxyground.local', adminHash]
  );

  // Creators
  const creatorsData = [
    {
      username: 'jayden_hoops',
      slug: 'jayden-hoops',
      display_name: 'Jayden "Hoops" Williams',
      bio: 'Professional basketball player and content creator based in London. Sharing drills, game highlights, and training tips.',
      sport: 'Basketball',
      location: 'London, UK',
    },
    {
      username: 'the_real_marco',
      slug: 'the-real-marco',
      display_name: 'Marco Fernandez',
      bio: 'Semi-professional footballer turned content creator. UEFA B licensed coach. Weekly training breakdowns and match analysis.',
      sport: 'Football',
      location: 'Manchester, UK',
    },
    {
      username: 'serena_smashes',
      slug: 'serena-smashes',
      display_name: 'Serena Okafor',
      bio: 'Junior tennis champion, WTA ranked. Documenting my journey from local courts to international tournaments.',
      sport: 'Tennis',
      location: 'Birmingham, UK',
    },
    {
      username: 'sprint_king_92',
      slug: 'sprint-king-92',
      display_name: 'Daniel Osei',
      bio: 'Track and field athlete specialising in the 100m and 200m sprint. British Athletics squad member. Training vlogs weekly.',
      sport: 'Athletics',
      location: 'Leeds, UK',
    },
    {
      username: 'boxing_with_remi',
      slug: 'boxing-with-remi',
      display_name: 'Remi Clarke',
      bio: 'Professional boxer with 18 wins, 3 losses. Behind the scenes of professional boxing — training camps, weigh-ins, fight nights.',
      sport: 'Boxing',
      location: 'Liverpool, UK',
    },
  ];

  const creatorIds = [];
  for (const c of creatorsData) {
    const { rows: [creator] } = await pool.query(
      `INSERT INTO creators (username, slug, display_name, bio, sport, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id`,
      [c.username, c.slug, c.display_name, c.bio, c.sport, c.location]
    );
    const email = `${c.username.replace(/_/g, '.')}@example.com`;
    await pool.query(
      `INSERT INTO creator_accounts (creator_id, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [creator.id, email, userHash]
    );
    creatorIds.push(creator.id);
  }

  // Businesses
  const businessData = [
    {
      email: 'partnerships@peakform.com',
      company_name: 'Peak Form Sports',
      slug: 'peak-form-sports',
      bio: 'UK-based sports equipment and performance gear brand. We partner with athletes who live and breathe their sport.',
      industry: 'Sports',
      website: 'https://peakform.example.com',
      location: 'London, UK',
    },
    {
      email: 'collab@nxtstride.com',
      company_name: 'NxtStride Apparel',
      slug: 'nxt-stride-apparel',
      bio: 'Athletic wear designed by athletes for athletes. Sustainable materials, performance cut. Looking for UK creators to represent the brand.',
      industry: 'Apparel',
      website: 'https://nxtstride.example.com',
      location: 'Bristol, UK',
    },
    {
      email: 'creators@voltcharge.com',
      company_name: 'Volt Charge Energy',
      slug: 'volt-charge-energy',
      bio: 'Clean energy drinks for high-performance athletes. Zero artificial colours. Real electrolytes. Partnering with creators across all sports.',
      industry: 'Nutrition',
      website: 'https://voltcharge.example.com',
      location: 'Edinburgh, UK',
    },
  ];

  const businessIds = [];
  for (const b of businessData) {
    const { rows: [biz] } = await pool.query(
      `INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET company_name = EXCLUDED.company_name
       RETURNING id`,
      [b.email, userHash, b.company_name, b.slug, b.bio, b.industry, b.website, b.location]
    );
    businessIds.push(biz.id);
  }

  // Creator Content (7 published, 3 pending)
  const contentData = [
    { creator_id: creatorIds[0], title: 'How I perfected my step-back jumper', body: 'The step-back jumper is one of the hardest shots to master consistently. Here is my 4-week training programme that finally made it click for me...', status: 'published', tags: ['basketball', 'training', 'shooting'] },
    { creator_id: creatorIds[0], title: 'My daily pre-game routine', body: 'People always ask what I do in the 3 hours before tip-off. Here is the exact routine I have followed for the past two seasons...', status: 'published', tags: ['basketball', 'routine', 'mindset'] },
    { creator_id: creatorIds[1], title: 'Breaking down the 4-3-3 pressing trigger', body: 'If you want to press effectively you need to understand pressing triggers. In this breakdown I analyse three Premier League examples from last season...', status: 'published', tags: ['football', 'tactics', 'coaching'] },
    { creator_id: creatorIds[1], title: 'Training drill: small-sided pressing games', body: 'This 4v4+2 possession drill is one of my favourite tools for teaching high press principles to youth teams...', status: 'published', tags: ['football', 'drills', 'youth'] },
    { creator_id: creatorIds[2], title: 'Serving at 120mph — the mechanics breakdown', body: 'Speed on serve comes from a combination of trophy position, shoulder rotation, and wrist snap. Here is what I changed in my technique last year...', status: 'published', tags: ['tennis', 'technique', 'serve'] },
    { creator_id: creatorIds[3], title: 'My block periodisation plan for sprint season', body: 'Block periodisation has transformed my training. I now split the year into accumulation, transmutation, and realisation blocks. Here is how...', status: 'published', tags: ['athletics', 'training', 'sprinting'] },
    { creator_id: creatorIds[4], title: 'Inside my training camp — week 1', body: 'Six weeks out from my next fight. Week one of camp is always about base conditioning and getting the eye back in. Sharing daily logs throughout...', status: 'published', tags: ['boxing', 'camp', 'behindthescenes'] },
    { creator_id: creatorIds[2], title: 'Tournament prep: clay court transition', body: 'Switching from hard courts to clay requires specific footwork adjustments and a different rally mindset. My notes from the transition period...', status: 'pending', tags: ['tennis', 'clay', 'tournament'] },
    { creator_id: creatorIds[3], title: 'Race day nutrition — what I eat before a 100m final', body: 'Fuelling for explosive sprint events is completely different from endurance sports. Here is my exact race day nutrition protocol...', status: 'pending', tags: ['athletics', 'nutrition', 'performance'] },
    { creator_id: creatorIds[4], title: 'Mental game: dealing with fight week pressure', body: 'The week of a fight is the hardest part. The training is done. Now it is all mental. Here is how I manage the anxiety and stay sharp...', status: 'pending', tags: ['boxing', 'mental', 'mindset'] },
  ];

  const contentIds = [];
  for (const c of contentData) {
    const { rows: [post] } = await pool.query(
      `INSERT INTO content (creator_id, title, body, tags, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [c.creator_id, c.title, c.body, JSON.stringify(c.tags), c.status]
    );
    contentIds.push({ id: post.id, status: c.status });
  }

  // Queue pending creator content
  for (const c of contentIds.filter(c => c.status === 'pending')) {
    await pool.query(
      `INSERT INTO moderation_queue (content_type, content_id) VALUES ($1, $2)`,
      ['creator_content', c.id]
    );
  }

  // Business Content (2 published, 1 pending)
  const bizContentData = [
    { business_id: businessIds[0], title: 'Looking for basketball creators — Q3 campaign', body: 'Peak Form is launching a new basketball shoe line in August. We are looking for UK-based basketball creators with 5k+ followers to partner with us on a 3-post campaign.', budget_range: '£500-£2k', target_sport: 'Basketball', status: 'published' },
    { business_id: businessIds[2], title: 'Volt Charge x Combat Sports — ambassador search', body: 'We are expanding into combat sports. Looking for boxers, MMA fighters, and martial artists to become Volt Charge ambassadors. Monthly retainer available.', budget_range: '£2k-£10k', target_sport: 'Boxing', status: 'published' },
    { business_id: businessIds[1], title: 'NxtStride Spring Kit — multi-sport creator brief', body: 'For our spring launch we want authentic creators across any sport wearing our new kit and sharing their honest experience. Gifting + commission available.', budget_range: 'Under £500', target_sport: null, status: 'pending' },
  ];

  const bizContentIds = [];
  for (const b of bizContentData) {
    const { rows: [bc] } = await pool.query(
      `INSERT INTO business_content (business_id, title, body, budget_range, target_sport, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [b.business_id, b.title, b.body, b.budget_range, b.target_sport, b.status]
    );
    bizContentIds.push({ id: bc.id, status: b.status });
  }

  for (const b of bizContentIds.filter(b => b.status === 'pending')) {
    await pool.query(
      `INSERT INTO moderation_queue (content_type, content_id) VALUES ($1, $2)`,
      ['business_content', b.id]
    );
  }

  // Opportunities (mix of creator and business)
  const opportunitiesData = [
    { posted_by_type: 'business', posted_by_id: businessIds[0], title: 'Brand ambassador — Peak Form Basketball', description: 'We are looking for an active UK basketball creator to be our lead ambassador for the next 12 months. Responsibilities include 2 posts per month, attending our annual launch event, and representing the brand at grassroots tournaments.', sport: 'Basketball', location: 'London, UK', budget: '£1,200/month', deadline: '2026-06-30' },
    { posted_by_type: 'business', posted_by_id: businessIds[2], title: 'Volt Charge: combat sports content creator', description: 'We need a combat sports creator (boxing, MMA, or kickboxing) to produce 4 pieces of content for our new campaign. Content should feel authentic and sport-focused, not overly branded.', sport: 'Boxing', location: 'Remote', budget: '£800 flat fee', deadline: '2026-05-31' },
    { posted_by_type: 'creator', posted_by_id: creatorIds[1], title: 'Co-host wanted — weekly football tactics podcast', description: 'I run a weekly football tactics podcast and I am looking for a co-host with a coaching background (UEFA B or above preferred). Episode commitment is 1 hour per week, fully remote recording.', sport: 'Football', location: 'Remote', budget: 'Revenue share', deadline: '2026-07-15' },
    { posted_by_type: 'creator', posted_by_id: creatorIds[3], title: 'Training partner for sprint sessions — London', description: 'Looking for a 100m/200m sprinter based in London to train with twice a week at Crystal Palace National Sports Centre. I document sessions so some content creation involved.', sport: 'Athletics', location: 'London, UK', budget: 'Free', deadline: '2026-05-20' },
    { posted_by_type: 'business', posted_by_id: businessIds[1], title: 'NxtStride: tennis creator gifting programme', description: 'We are gifting our new performance tennis kit to 10 tennis creators in the UK. No paid commitment — just wear the kit, share your honest thoughts, and tag us. Kit value approximately £180.', sport: 'Tennis', location: 'UK-wide', budget: 'Gifting only', deadline: '2026-06-01' },
  ];

  for (const o of opportunitiesData) {
    await pool.query(
      `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [o.posted_by_type, o.posted_by_id, o.title, o.description, o.sport, o.location, o.budget, o.deadline]
    );
  }

  // Audit log seed entry
  if (admin) {
    await pool.query(
      `INSERT INTO audit_log (actor_type, actor_id, action, metadata)
       VALUES ($1, $2, $3, $4)`,
      ['system', null, 'DATABASE_SEEDED', JSON.stringify({ seeded_at: new Date().toISOString() })]
    );
  }

  logger.info('Seed complete', {
    admins: 1,
    creators: creatorsData.length,
    businesses: businessData.length,
    content: contentData.length,
    opportunities: opportunitiesData.length,
  });
}

if (require.main === module) {
  require('dotenv').config();
  require('../config');
  seed().then(() => process.exit(0)).catch((err) => {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  });
}

module.exports = { seed };
