'use strict';
const bcrypt = require('bcryptjs');
const db = require('./client');
const logger = require('../logger');
const { slugify } = require('../utils/slugify');

function seedDatabase() {
  const ROUNDS = 12;
  const CREATOR_PASS = bcrypt.hashSync('Password1!', ROUNDS);
  const BUSINESS_PASS = bcrypt.hashSync('Password1!', ROUNDS);
  const ADMIN_PASS = bcrypt.hashSync('Internet2026@', ROUNDS);

  const insertAdmin = db.prepare('INSERT OR IGNORE INTO admins (email, password_hash) VALUES (?, ?)');
  insertAdmin.run('admin@plxyground.local', ADMIN_PASS);

  const insertCreator = db.prepare(`
    INSERT OR IGNORE INTO creators (username, slug, display_name, bio, sport, location)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertCreatorAccount = db.prepare(`
    INSERT OR IGNORE INTO creator_accounts (creator_id, email, password_hash, is_email_verified)
    VALUES (?, ?, ?, 1)
  `);

  const creators = [
    { username: 'jayden_hoops', name: 'Jayden Carter', sport: 'Basketball', location: 'London, UK', bio: 'Pro baller sharing highlights, drills and court life from the streets of London.', email: 'jayden@example.com' },
    { username: 'emma_runs', name: 'Emma Singh', sport: 'Athletics', location: 'Manchester, UK', bio: '400m specialist. Documenting my journey from club runner to national competition.', email: 'emma@example.com' },
    { username: 'kai_kicks', name: 'Kai Thompson', sport: 'Football', location: 'Birmingham, UK', bio: 'Left winger. Freestyle tricks, match analysis and daily training grind.', email: 'kai@example.com' },
    { username: 'sara_serves', name: 'Sara Okafor', sport: 'Tennis', location: 'Bristol, UK', bio: 'Grasscourt player. Sharing match reviews, technique tips and the tennis lifestyle.', email: 'sara@example.com' },
    { username: 'leo_boxing', name: 'Leo Martinez', sport: 'Boxing', location: 'Leeds, UK', bio: 'Amateur boxer training toward my first ABA title. Raw, unfiltered fight content.', email: 'leo@example.com' },
  ];

  const creatorIds = [];
  for (const c of creators) {
    const slug = slugify(c.username);
    insertCreator.run(c.username, slug, c.name, c.bio, c.sport, c.location);
    const row = db.prepare('SELECT id FROM creators WHERE username = ?').get(c.username);
    insertCreatorAccount.run(row.id, c.email, CREATOR_PASS);
    creatorIds.push(row.id);
  }

  const insertBusiness = db.prepare(`
    INSERT OR IGNORE INTO businesses (email, password_hash, company_name, slug, bio, industry, location, is_email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const businesses = [
    { email: 'contact@peakgear.com', name: 'Peak Gear', industry: 'Sports Apparel', location: 'London, UK', bio: 'Premium sports apparel engineered for performance. Kitting out athletes since 2018.' },
    { email: 'hello@fuelup.io', name: 'FuelUp Nutrition', industry: 'Nutrition', location: 'Manchester, UK', bio: 'Science-backed nutrition for serious athletes. Protein, hydration and recovery.' },
    { email: 'partnerships@sportsmedia.co', name: 'Sports Media Co', industry: 'Media', location: 'Birmingham, UK', bio: "The UK's fastest growing sports content platform. We amplify creator voices." },
  ];

  const bizIds = [];
  for (const b of businesses) {
    const slug = slugify(b.name);
    insertBusiness.run(b.email, BUSINESS_PASS, b.name, slug, b.bio, b.industry, b.location);
    const row = db.prepare('SELECT id FROM businesses WHERE email = ?').get(b.email);
    bizIds.push(row.id);
  }

  const insertContent = db.prepare(`
    INSERT OR IGNORE INTO content (creator_id, title, body, media_type, tags, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertModerationQueue = db.prepare(`
    INSERT INTO moderation_queue (content_type, content_id, status) VALUES (?, ?, ?)
  `);

  const contentSeeds = [
    { cIdx: 0, title: '5 Drills That Improved My First Step', body: 'These five court drills transformed my lateral quickness in just three weeks. Here is the full breakdown.', media_type: 'none', tags: '["basketball","training","drills"]', status: 'published' },
    { cIdx: 1, title: 'My Pre-Race Morning Routine', body: 'Race day starts the night before. Here is exactly how I prepare mentally and physically for a 400m final.', media_type: 'none', tags: '["athletics","routine","mindset"]', status: 'published' },
    { cIdx: 2, title: 'Breaking Down the Perfect Trivela', body: 'The outside-of-the-boot curl is one of the most satisfying skills in football. Watch my step-by-step breakdown.', media_type: 'image', tags: '["football","freestyle","technique"]', status: 'published' },
    { cIdx: 3, title: 'Why Grass Court Tennis Is a Different Game', body: 'Slice, serve and volley. Everything changes when you step onto grass. Here is my tactical guide.', media_type: 'none', tags: '["tennis","tactics","grasscourt"]', status: 'published' },
    { cIdx: 4, title: 'My First Sparring Session — Raw Footage & Thoughts', body: 'Stepping into the ring for the first time is humbling. Here is what I learned from my debut sparring.', media_type: 'video', tags: '["boxing","sparring","beginners"]', status: 'published' },
    { cIdx: 0, title: 'Court Vlog: Training with the U18 Academy', body: 'Got invited to train with the local academy. The level is different. Full vlog below.', media_type: 'video', tags: '["basketball","vlog","academy"]', status: 'published' },
    { cIdx: 1, title: 'Track Season — Week 4 Progress Report', body: 'PB attempts, two travel meets and a torn hamstring scare. Here is week four of my track season diary.', media_type: 'none', tags: '["athletics","progress","season"]', status: 'published' },
    { cIdx: 2, title: 'Match Analysis: How I Played Against a Zonal Defence', body: 'Our opponents ran a tight zonal shape. Here is what worked, what did not, and what I would do differently.', media_type: 'none', tags: '["football","analysis","tactics"]', status: 'pending' },
    { cIdx: 3, title: 'Kit Review: Comparing the Top 3 Grass Court Shoes', body: 'I tested three leading grass court shoes over a full month. Here is my honest verdict on grip, feel and durability.', media_type: 'image', tags: '["tennis","gear","review"]', status: 'pending' },
    { cIdx: 4, title: 'Nutrition for Boxers — What I Eat in a Training Week', body: 'Weight management meets performance. Here is my full weekly nutrition plan in fight camp.', media_type: 'none', tags: '["boxing","nutrition","training"]', status: 'pending' },
  ];

  for (const c of contentSeeds) {
    const creatorId = creatorIds[c.cIdx];
    insertContent.run(creatorId, c.title, c.body, c.media_type, c.tags, c.status);
    const row = db.prepare('SELECT id FROM content WHERE title = ? AND creator_id = ?').get(c.title, creatorId);
    if (c.status === 'pending') {
      insertModerationQueue.run('creator_content', row.id, 'pending');
    }
  }

  const insertBizContent = db.prepare(`
    INSERT OR IGNORE INTO business_content (business_id, title, body, budget_range, target_sport, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const bizContentSeeds = [
    { bIdx: 0, title: 'Peak Gear x Athletes Campaign — Summer 2026', body: 'We are looking for UK-based athlete creators to feature in our Summer 2026 campaign. Paid partnership, full usage rights.', budget_range: '£500–£2,000', target_sport: 'Basketball', status: 'published' },
    { bIdx: 1, title: 'FuelUp Nutrition Brand Ambassadors Wanted', body: 'Join the FuelUp team. We are expanding our ambassador programme and looking for performance athletes who live by clean nutrition.', budget_range: 'Product + £300/month', target_sport: 'Athletics', status: 'published' },
    { bIdx: 2, title: 'Sports Media Co — Content Creator Spotlight Series', body: 'We are producing a 10-part UK sports creator documentary. Looking for compelling athlete stories across all sports.', budget_range: '£1,000–£5,000', target_sport: 'Mixed', status: 'pending' },
  ];

  for (const b of bizContentSeeds) {
    const bizId = bizIds[b.bIdx];
    insertBizContent.run(bizId, b.title, b.body, b.budget_range, b.target_sport, b.status);
    if (b.status === 'pending') {
      const row = db.prepare('SELECT id FROM business_content WHERE title = ? AND business_id = ?').get(b.title, bizId);
      insertModerationQueue.run('business_content', row.id, 'pending');
    }
  }

  const insertOpp = db.prepare(`
    INSERT OR IGNORE INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')
  `);

  const opps = [
    { type: 'business', idx: 0, title: 'Seeking Basketball Creator for Kit Shoot', desc: 'Peak Gear needs an energetic basketball creator for a 1-day product shoot in London. Full kit provided plus fee.', sport: 'Basketball', location: 'London, UK', budget: '£400', deadline: '2026-06-30' },
    { type: 'business', idx: 1, title: 'Protein Supplement Review — Paid Partnership', desc: 'FuelUp is looking for endurance or strength athletes to review our new range. Flexible format — video or written.', sport: 'Athletics', location: 'Remote', budget: '£150 + product', deadline: '2026-07-15' },
    { type: 'creator', idx: 0, title: 'Looking for a Videographer for Match Day', desc: 'Need a local videographer to film and edit a football match highlight reel. One-off gig, match in Birmingham.', sport: 'Football', location: 'Birmingham, UK', budget: '£200', deadline: '2026-06-15' },
    { type: 'business', idx: 2, title: 'Documentary Participants — All Sports Welcome', desc: 'Sports Media Co is casting for a UK sports creator documentary. All sports, all levels. Must be UK-based.', sport: 'Mixed', location: 'UK', budget: '£1,500', deadline: '2026-08-01' },
    { type: 'creator', idx: 3, title: 'Tennis Player Wanted for Lifestyle Brand Collab', desc: 'I am a tennis creator partnering with a lifestyle brand for a social media series. Looking for a doubles partner.', sport: 'Tennis', location: 'Bristol, UK', budget: 'Revenue share', deadline: '2026-06-20' },
  ];

  for (const o of opps) {
    const posterId = o.type === 'business' ? bizIds[o.idx] : creatorIds[o.idx];
    insertOpp.run(o.type, posterId, o.title, o.desc, o.sport, o.location, o.budget, o.deadline);
  }

  logger.info('Database seeded successfully');
}

module.exports = { seedDatabase };
