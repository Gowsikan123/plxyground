'use strict';
const bcrypt = require('bcryptjs');
const db = require('./client');
const logger = require('../logger');
const { slugify } = require('../utils/slugify');

function seedDatabase() {
  const adminHash = bcrypt.hashSync('Internet2026@', 12);
  db.prepare('INSERT OR IGNORE INTO admins (email, password_hash) VALUES (?, ?)').run('admin@plxyground.local', adminHash);

  const creatorPassword = bcrypt.hashSync('Password1!', 12);

  const creators = [
    { username: 'jayden_hoops', display_name: 'Jayden Carter', sport: 'Basketball', location: 'London, UK', bio: 'Pro baller sharing highlights, drills and court life from the streets of London.' },
    { username: 'emma_runs', display_name: 'Emma Singh', sport: 'Athletics', location: 'Manchester, UK', bio: '400m specialist. Documenting my journey from club runner to national competition.' },
    { username: 'kai_kicks', display_name: 'Kai Thompson', sport: 'Football', location: 'Birmingham, UK', bio: 'Left winger. Freestyle tricks, match analysis and daily training grind.' },
    { username: 'sara_serves', display_name: 'Sara Okafor', sport: 'Tennis', location: 'Bristol, UK', bio: 'Grasscourt player. Sharing match reviews, technique tips and the tennis lifestyle.' },
    { username: 'leo_boxing', display_name: 'Leo Martinez', sport: 'Boxing', location: 'Leeds, UK', bio: 'Amateur boxer training toward my first ABA title. Raw, unfiltered fight content.' },
  ];

  const creatorIds = [];
  for (const c of creators) {
    const slug = slugify(c.username);
    const result = db.prepare(
      'INSERT OR IGNORE INTO creators (username, slug, display_name, bio, sport, location) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(c.username, slug, c.display_name, c.bio, c.sport, c.location);
    const row = db.prepare('SELECT id FROM creators WHERE username = ?').get(c.username);
    creatorIds.push(row.id);
    const email = `${c.username.replace('_', '.')}@plxyground.local`;
    db.prepare(
      'INSERT OR IGNORE INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)'
    ).run(row.id, email, creatorPassword);
  }

  const bizPassword = bcrypt.hashSync('Password1!', 12);
  const businesses = [
    { email: 'contact@peakgear.com', company_name: 'Peak Gear', industry: 'Sports Apparel', location: 'London, UK', bio: 'Premium sports apparel engineered for performance. Kitting out athletes since 2018.', website: 'https://peakgear.com' },
    { email: 'hello@fuelup.io', company_name: 'FuelUp Nutrition', industry: 'Nutrition', location: 'Manchester, UK', bio: 'Science-backed nutrition for serious athletes. Protein, hydration and recovery.', website: 'https://fuelup.io' },
    { email: 'partnerships@sportsmedia.co', company_name: 'Sports Media Co', industry: 'Media', location: 'Birmingham, UK', bio: "The UK's fastest growing sports content platform. We amplify creator voices.", website: 'https://sportsmedia.co' },
  ];

  const bizIds = [];
  for (const b of businesses) {
    const slug = slugify(b.company_name);
    db.prepare(
      'INSERT OR IGNORE INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(b.email, bizPassword, b.company_name, slug, b.bio, b.industry, b.website, b.location);
    const row = db.prepare('SELECT id FROM businesses WHERE email = ?').get(b.email);
    bizIds.push(row.id);
  }

  const contentItems = [
    { creator_id: creatorIds[0], title: 'Morning Hoop Session at Peckham Rye', body: 'Six AM and the court was empty. Two hours of triple-threat drills and mid-range work. This is how consistency looks before anyone else wakes up.', media_type: 'none', tags: '["basketball","training","morning"]', status: 'published' },
    { creator_id: creatorIds[0], title: 'Breaking Down the Crossover: Step by Step', body: 'Everyone talks about the crossover but few break it down. Here is my full breakdown — body positioning, timing and how to read the defender.', media_type: 'none', tags: '["basketball","skills","tutorial"]', status: 'published' },
    { creator_id: creatorIds[1], title: 'Track Tuesday: 400m Interval Sets', body: 'Six 400m repeats at race pace. Splits were 58, 59, 60, 61, 60, 59. Happy with the consistency. Recovery 90 seconds between each.', media_type: 'none', tags: '["athletics","400m","intervals"]', status: 'published' },
    { creator_id: creatorIds[1], title: 'My Journey to the National Championships', body: 'Three years ago I could barely break 65 seconds. This summer I ran 54.2 at the regional qualifier. Here is the full story of how I got here.', media_type: 'none', tags: '["athletics","journey","nationals"]', status: 'published' },
    { creator_id: creatorIds[2], title: 'Freestyle Friday: Top 10 Skills This Week', body: 'Pulled out the best clips from this week — around the world, neck stall and a couple of combos that took me months to land. Comment your favourite.', media_type: 'none', tags: '["football","freestyle","skills"]', status: 'published' },
    { creator_id: creatorIds[2], title: 'Match Day Vlog: Non-League vs Premier Academy', body: 'We lined up against a Premier League academy side. Here is the full vlog from warm up to final whistle — honest, raw and unedited.', media_type: 'none', tags: '["football","matchday","vlog"]', status: 'published' },
    { creator_id: creatorIds[3], title: 'Grasscourt Season: What I Learned at Surbiton', body: 'My first proper ITF grasscourt event. Five matches, two wins, plenty of lessons. The surface rewards patience and short backswings — here is what clicked.', media_type: 'none', tags: '["tennis","grasscourt","tournament"]', status: 'published' },
    { creator_id: creatorIds[3], title: 'Serve Technique Deep Dive', body: 'I filmed my serve from four angles and broke down every fault. Ball toss, shoulder turn, pronation — everything I found and fixed.', media_type: 'none', tags: '["tennis","technique","serve"]', status: 'pending' },
    { creator_id: creatorIds[4], title: 'Sparring Session: What I Fixed After Last Month', body: 'Last month my guard was too low and I was getting caught with jabs. Worked specifically on guard position for four weeks. This is the sparring session that proved it worked.', media_type: 'none', tags: '["boxing","sparring","technique"]', status: 'pending' },
    { creator_id: creatorIds[4], title: 'Weight Cut Diary: 7 Days Out from the Fight', body: 'Day by day log of my cut from 72kg to 69kg. Meals, water intake, training load, mood. The honest version that nobody shows you.', media_type: 'none', tags: '["boxing","weightcut","fight"]', status: 'pending' },
  ];

  for (const item of contentItems) {
    const result = db.prepare(
      'INSERT OR IGNORE INTO content (creator_id, title, body, media_type, tags, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(item.creator_id, item.title, item.body, item.media_type, item.tags, item.status);
    if (item.status === 'pending' && result.lastInsertRowid) {
      db.prepare(
        'INSERT OR IGNORE INTO moderation_queue (content_type, content_id) VALUES (?, ?)'
      ).run('creator_content', result.lastInsertRowid);
    }
  }

  const bizContentItems = [
    { business_id: bizIds[0], title: 'Peak Gear x Basketball Creators — Kit Campaign 2026', body: 'We are looking for UK basketball creators to wear and review our new Performance Series kit. Post across your channels, tag us and receive a full kit. Ideal for creators with 500+ engaged followers.', budget_range: '£500–£2k', target_sport: 'Basketball', status: 'published' },
    { business_id: bizIds[1], title: 'FuelUp Nutrition Ambassador Programme — Spring 2026', body: 'Join our growing team of athlete ambassadors. Receive monthly product bundles, exclusive discount codes to share with your audience and a monthly retainer for consistent posts.', budget_range: '£2k–£10k', target_sport: 'Athletics', status: 'published' },
    { business_id: bizIds[2], title: 'Sports Media Co — Content Creator Collab Series', body: 'We are producing a six-episode digital series celebrating grassroots UK sport. Looking for authentic creators in football, boxing and tennis to feature. Full production support provided.', budget_range: '£10k+', target_sport: 'Football', status: 'pending' },
  ];

  for (const item of bizContentItems) {
    const result = db.prepare(
      'INSERT OR IGNORE INTO business_content (business_id, title, body, budget_range, target_sport, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(item.business_id, item.title, item.body, item.budget_range, item.target_sport, item.status);
    if (item.status === 'pending' && result.lastInsertRowid) {
      db.prepare(
        'INSERT OR IGNORE INTO moderation_queue (content_type, content_id) VALUES (?, ?)'
      ).run('business_content', result.lastInsertRowid);
    }
  }

  const opportunities = [
    { posted_by_type: 'business', posted_by_id: bizIds[0], title: 'Basketball Brand Ambassador — London', description: 'Peak Gear seeks a passionate London-based basketball creator to represent the brand at events and across social media throughout 2026.', sport: 'Basketball', location: 'London, UK', budget: '£1,500', deadline: '31 May 2026' },
    { posted_by_type: 'business', posted_by_id: bizIds[1], title: 'Athletics Nutrition Partnership', description: 'FuelUp is partnering with three UK track and field athletes for a six-month ambassador deal. Full product support plus paid content requirements.', sport: 'Athletics', location: 'UK-wide', budget: '£800/month', deadline: '15 June 2026' },
    { posted_by_type: 'creator', posted_by_id: creatorIds[2], title: 'Looking for Goalkeeper for Content Collab', description: 'I create freestyle and skills content and want to collaborate with a goalkeeper creator for a series of crossbar challenge and penalty videos.', sport: 'Football', location: 'Birmingham, UK', budget: 'Revenue share', deadline: '30 May 2026' },
    { posted_by_type: 'business', posted_by_id: bizIds[2], title: 'Boxing Docuseries — Paid Creator Spot', description: 'Sports Media Co is producing a documentary-style series about amateur boxing in the UK. One paid creator spot available. Must be based in England.', sport: 'Boxing', location: 'England, UK', budget: '£3,000', deadline: '20 June 2026' },
    { posted_by_type: 'creator', posted_by_id: creatorIds[3], title: 'Tennis Training Partner Content — Bristol', description: 'Looking to create regular training content with another tennis creator in the Bristol area. Happy to split ad revenue and cross-promote.', sport: 'Tennis', location: 'Bristol, UK', budget: 'Revenue share', deadline: '10 June 2026' },
  ];

  for (const opp of opportunities) {
    db.prepare(
      'INSERT OR IGNORE INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(opp.posted_by_type, opp.posted_by_id, opp.title, opp.description, opp.sport, opp.location, opp.budget, opp.deadline);
  }

  logger.info('Seed complete. Admin, 5 creators, 3 businesses, 10 posts, 3 biz content, 5 opportunities inserted.');
}

module.exports = { seedDatabase };
