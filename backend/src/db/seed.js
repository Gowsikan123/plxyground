'use strict';
const bcrypt = require('bcryptjs');
const db = require('./client');
const logger = require('../logger');
const { slugify } = require('../utils/slugify');

function seedDatabase() {
  const ROUNDS = 12;

  // Admins
  const adminHash = bcrypt.hashSync('Internet2026@', ROUNDS);
  db.prepare('INSERT OR IGNORE INTO admins (email, password_hash) VALUES (?, ?)').run(
    'admin@plxyground.local',
    adminHash
  );

  const creatorPassword = bcrypt.hashSync('Password1!', ROUNDS);

  const creators = [
    {
      username: 'jayden_hoops',
      display_name: 'Jayden Carter',
      sport: 'Basketball',
      location: 'London, UK',
      bio: 'Pro baller sharing highlights, drills and court life from the streets of London.',
    },
    {
      username: 'emma_runs',
      display_name: 'Emma Singh',
      sport: 'Athletics',
      location: 'Manchester, UK',
      bio: '400m specialist. Documenting my journey from club runner to national competition.',
    },
    {
      username: 'kai_kicks',
      display_name: 'Kai Thompson',
      sport: 'Football',
      location: 'Birmingham, UK',
      bio: 'Left winger. Freestyle tricks, match analysis and daily training grind.',
    },
    {
      username: 'sara_serves',
      display_name: 'Sara Okafor',
      sport: 'Tennis',
      location: 'Bristol, UK',
      bio: 'Grasscourt player. Sharing match reviews, technique tips and the tennis lifestyle.',
    },
    {
      username: 'leo_boxing',
      display_name: 'Leo Martinez',
      sport: 'Boxing',
      location: 'Leeds, UK',
      bio: 'Amateur boxer training toward my first ABA title. Raw, unfiltered fight content.',
    },
  ];

  const creatorIds = [];
  for (const c of creators) {
    const slug = slugify(c.username);
    const res = db
      .prepare(
        'INSERT OR IGNORE INTO creators (username, slug, display_name, bio, sport, location) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(c.username, slug, c.display_name, c.bio, c.sport, c.location);
    let creatorId;
    if (res.changes > 0) {
      creatorId = res.lastInsertRowid;
    } else {
      creatorId = db.prepare('SELECT id FROM creators WHERE username = ?').get(c.username).id;
    }
    creatorIds.push(creatorId);
    const email = `${c.username.replace('_', '.')}@example.com`;
    db.prepare(
      'INSERT OR IGNORE INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)'
    ).run(creatorId, email, creatorPassword);
  }

  // Businesses
  const businesses = [
    {
      email: 'contact@peakgear.com',
      company_name: 'Peak Gear',
      industry: 'Sports Apparel',
      location: 'London, UK',
      bio: 'Premium sports apparel engineered for performance. Kitting out athletes since 2018.',
    },
    {
      email: 'hello@fuelup.io',
      company_name: 'FuelUp Nutrition',
      industry: 'Nutrition',
      location: 'Manchester, UK',
      bio: 'Science-backed nutrition for serious athletes. Protein, hydration and recovery.',
    },
    {
      email: 'partnerships@sportsmedia.co',
      company_name: 'Sports Media Co',
      industry: 'Media',
      location: 'Birmingham, UK',
      bio: "The UK's fastest growing sports content platform. We amplify creator voices.",
    },
  ];

  const bizIds = [];
  for (const b of businesses) {
    const slug = slugify(b.company_name);
    const res = db
      .prepare(
        'INSERT OR IGNORE INTO businesses (email, password_hash, company_name, slug, bio, industry, location) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(b.email, creatorPassword, b.company_name, slug, b.bio, b.industry, b.location);
    let bizId;
    if (res.changes > 0) {
      bizId = res.lastInsertRowid;
    } else {
      bizId = db.prepare('SELECT id FROM businesses WHERE email = ?').get(b.email).id;
    }
    bizIds.push(bizId);
  }

  // Creator Content
  const contentItems = [
    { creator_id: creatorIds[0], title: 'My Top 5 Ball Handling Drills', body: 'Here are the drills I use every day to keep my handles sharp. These can be done solo on any court.', tags: '["basketball","training","drills"]', status: 'published', media_type: 'none' },
    { creator_id: creatorIds[0], title: '3-on-3 Tournament Recap', body: 'We went 5-0 at the Brixton courts this weekend. Here is how it went down and what I learned.', tags: '["basketball","tournament","recap"]', status: 'published', media_type: 'none' },
    { creator_id: creatorIds[1], title: 'Pre-Race Morning Routine', body: 'What I eat, how I warm up, and how I get mentally ready before a 400m race. Consistency is everything.', tags: '["athletics","routine","400m"]', status: 'published', media_type: 'none' },
    { creator_id: creatorIds[1], title: 'Track Session — 200m Intervals', body: 'Six rounds of 200m with 90 second rest. My splits and thoughts after each round.', tags: '["athletics","training","intervals"]', status: 'published', media_type: 'none' },
    { creator_id: creatorIds[2], title: 'Freestyle Friday: Signature Move Tutorial', body: 'Breaking down my signature rainbow flick step by step. Practice this slowly then build up speed.', tags: '["football","freestyle","tutorial"]', status: 'published', media_type: 'none' },
    { creator_id: creatorIds[2], title: 'Analysing My Winger Role', body: 'I watched back four of my matches this month. Here is what I need to work on and where I am improving.', tags: '["football","analysis","winger"]', status: 'published', media_type: 'none' },
    { creator_id: creatorIds[3], title: 'Serve Mechanics Breakdown', body: 'My coach filmed my serve from four angles. I am sharing what we spotted and how I am correcting it.', tags: '["tennis","serve","technique"]', status: 'published', media_type: 'none' },
    { creator_id: creatorIds[3], title: 'New Racket Review: Testing the Pro Staff 97', body: 'First session impressions after switching from my old frame. Feel, control and power tested at the club.', tags: '["tennis","gear","review"]', status: 'pending', media_type: 'none' },
    { creator_id: creatorIds[4], title: 'Sparring Session Highlights', body: 'Three rounds with my gym partner. Looking at my jab setups and how I need to tighten my guard.', tags: '["boxing","sparring","highlights"]', status: 'pending', media_type: 'none' },
    { creator_id: creatorIds[4], title: 'Road Work: 5am Run Diary', body: 'Week 3 of my fight camp road work. Distances, paces and how my conditioning is building.', tags: '["boxing","fitness","training"]', status: 'pending', media_type: 'none' },
  ];

  for (const item of contentItems) {
    const res = db
      .prepare(
        'INSERT OR IGNORE INTO content (creator_id, title, body, tags, status, media_type) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(item.creator_id, item.title, item.body, item.tags, item.status, item.media_type);
    if (res.changes > 0 && item.status === 'pending') {
      db.prepare(
        "INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', ?)"
      ).run(res.lastInsertRowid);
    }
  }

  // Business Content
  const bizContent = [
    { business_id: bizIds[0], title: 'Kit Partnership Campaign — Spring 2026', body: 'We are looking for UK-based sports creators to wear and review our new Spring kit range. We offer free product plus a paid content fee.', budget_range: '£500–£2k', target_sport: 'Any', status: 'published' },
    { business_id: bizIds[1], title: 'Protein Range Launch — Creator Seeding', body: 'FuelUp Nutrition is seeding our new plant protein range to 10 performance athletes across the UK. Share your honest review with your audience.', budget_range: 'Under £500', target_sport: 'Athletics', status: 'published' },
    { business_id: bizIds[2], title: 'Featured Creator Series — Apply Now', body: 'Sports Media Co is building a 12-part digital series featuring rising UK sports creators. Apply with your content handle and sport.', budget_range: '£2k–£10k', target_sport: 'Any', status: 'pending' },
  ];

  for (const bc of bizContent) {
    const res = db
      .prepare(
        'INSERT OR IGNORE INTO business_content (business_id, title, body, budget_range, target_sport, status) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(bc.business_id, bc.title, bc.body, bc.budget_range, bc.target_sport, bc.status);
    if (res.changes > 0 && bc.status === 'pending') {
      db.prepare(
        "INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', ?)"
      ).run(res.lastInsertRowid);
    }
  }

  // Opportunities
  const opportunities = [
    { posted_by_type: 'business', posted_by_id: bizIds[0], title: 'Brand Ambassador — Peak Gear 2026', description: 'We are seeking 3 UK-based sports creators to become paid brand ambassadors for our 2026 kit range. 12-month contract. Must post at least once per month featuring our products.', sport: 'Any', location: 'UK-wide', budget: '£1,200/year', deadline: '31 May 2026' },
    { posted_by_type: 'business', posted_by_id: bizIds[1], title: 'Nutrition Content Creator Partnership', description: 'FuelUp Nutrition is partnering with performance athletes who want to document their nutrition journey. Monthly retainer plus product supply.', sport: 'Athletics', location: 'UK-wide', budget: '£300/month', deadline: '15 June 2026' },
    { posted_by_type: 'creator', posted_by_id: creatorIds[0], title: 'Looking for Brand Collab — Basketball Content', description: 'I am a London-based basketball creator with an engaged audience. Looking for sports brands who want authentic basketball content. Open to kit, equipment or nutrition partnerships.', sport: 'Basketball', location: 'London, UK', budget: 'Open to offers', deadline: '' },
    { posted_by_type: 'business', posted_by_id: bizIds[2], title: 'Paid Content Commission — Sports Media Co', description: 'We commission short-form sports documentary content from UK creators. 3-5 minute videos on your sport, your story. We handle distribution. Creator keeps rights.', sport: 'Any', location: 'UK-wide', budget: '£500 per video', deadline: '30 June 2026' },
    { posted_by_type: 'creator', posted_by_id: creatorIds[2], title: 'Football Freestyle Collaboration', description: 'Seeking a football freestyle partner in the Midlands for collab content. You bring your tricks, I bring mine. Let us create something viral together.', sport: 'Football', location: 'Birmingham, UK', budget: 'No budget — collab only', deadline: '' },
  ];

  for (const opp of opportunities) {
    db.prepare(
      'INSERT OR IGNORE INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      opp.posted_by_type,
      opp.posted_by_id,
      opp.title,
      opp.description,
      opp.sport,
      opp.location,
      opp.budget,
      opp.deadline
    );
  }

  logger.info('Seed complete.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
