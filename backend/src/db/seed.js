'use strict';
const bcrypt = require('bcryptjs');
const db = require('./client');

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seed() {
  const hash = (pw) => bcrypt.hashSync(pw, 12);

  // Admin
  await db.prepare(`INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`)
    .run('admin@plxyground.local', hash('Internet2026@'));

  // Creators
  const creators = [
    { username: 'marcus_hoops', display_name: 'Marcus Hoops', sport: 'Basketball', location: 'London, UK', bio: 'Ballin since day one. NBA aspirations.', email: 'marcus@test.com' },
    { username: 'swift_feet', display_name: 'Swift Feet', sport: 'Football', location: 'Manchester, UK', bio: 'Football content, skills & drills.', email: 'swift@test.com' },
    { username: 'ace_tennislife', display_name: 'Ace TennisLife', sport: 'Tennis', location: 'Birmingham, UK', bio: 'Breaking down serves and volleys.', email: 'ace@test.com' },
    { username: 'sprint_king', display_name: 'Sprint King', sport: 'Athletics', location: 'Glasgow, UK', bio: '100m personal best: 10.4s.', email: 'sprint@test.com' },
    { username: 'knockout_clips', display_name: 'Knockout Clips', sport: 'Boxing', location: 'Liverpool, UK', bio: 'Ring life. Training content daily.', email: 'knockout@test.com' },
  ];

  const creatorIds = [];
  for (const c of creators) {
    const slug = slugify(c.username);
    const follower_count = Math.floor(Math.random() * 5000) + 100;
    const existing = await db.prepare('SELECT id FROM creators WHERE username = $1').get(c.username);
    let creatorId;
    if (!existing) {
      const result = await db.prepare(`INSERT INTO creators (username, slug, display_name, bio, sport, location, follower_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`)
        .run(c.username, slug, c.display_name, c.bio, c.sport, c.location, follower_count);
      creatorId = result.lastInsertRowid;
    } else {
      creatorId = existing.id;
    }
    await db.prepare(`INSERT INTO creator_accounts (creator_id, email, password_hash, is_email_verified) VALUES ($1, $2, $3, 1) ON CONFLICT (email) DO NOTHING`)
      .run(creatorId, c.email, hash('Test1234!'));
    creatorIds.push(creatorId);
  }

  // Businesses
  const businesses = [
    { email: 'nike@test.com', company_name: 'NikeUK Partnerships', industry: 'Sportswear', website: 'https://nike.com', location: 'London, UK', bio: 'Partnering with the next generation of athletes.' },
    { email: 'redbull@test.com', company_name: 'Red Bull Media', industry: 'Energy Drinks', website: 'https://redbull.com', location: 'London, UK', bio: 'We give wings to athletes and creators.' },
    { email: 'gymshark@test.com', company_name: 'Gymshark', industry: 'Fitness Apparel', website: 'https://gymshark.com', location: 'Birmingham, UK', bio: 'Empowering athletes worldwide.' },
  ];

  const bizIds = [];
  for (const b of businesses) {
    const slug = slugify(b.company_name);
    const existing = await db.prepare('SELECT id FROM businesses WHERE email = $1').get(b.email);
    let bizId;
    if (!existing) {
      const result = await db.prepare(`INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location, is_email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1) RETURNING id`)
        .run(b.email, hash('Test1234!'), b.company_name, slug, b.bio, b.industry, b.website, b.location);
      bizId = result.lastInsertRowid;
    } else {
      bizId = existing.id;
    }
    bizIds.push(bizId);
  }

  // Content
  const contentItems = [
    { title: 'My top 5 dribble moves', body: 'Breaking down each move with slow-mo clips.', tags: '["basketball","skills"]', status: 'published' },
    { title: 'Pre-season fitness routine', body: 'Full week breakdown of what I do to stay sharp.', tags: '["fitness","training"]', status: 'published' },
    { title: 'How I got scouted', body: 'The story behind my first pro trial.', tags: '["motivation"]', status: 'published' },
    { title: 'Best training drills for beginners', body: 'Simple drills you can do anywhere.', tags: '["drills","beginner"]', status: 'published' },
    { title: 'Game day nutrition', body: 'What I eat on matchday and why.', tags: '["nutrition"]', status: 'published' },
    { title: 'Interview: my coach speaks', body: 'Exclusive chat with my head coach.', tags: '["interview"]', status: 'published' },
    { title: 'Recovery tips after a hard session', body: 'Ice baths, stretching, and sleep.', tags: '["recovery"]', status: 'published' },
    { title: 'Mental game is everything', body: 'How I stay focused under pressure.', tags: '["mindset"]', status: 'published' },
    { title: 'New kit reveal 2026', body: 'Unboxing my new season kit — LINK IN BIO', tags: '["gear"]', status: 'pending' },
    { title: 'Behind the scenes at Wembley', body: 'Never seen footage from training day.', tags: '["behindthescenes"]', status: 'pending' },
  ];

  for (let i = 0; i < contentItems.length; i++) {
    const c = contentItems[i];
    const creatorId = creatorIds[i % creatorIds.length];
    const result = await db.prepare(`INSERT INTO content (creator_id, title, body, tags, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`)
      .run(creatorId, c.title, c.body, c.tags, c.status);
    await db.prepare(`INSERT INTO moderation_queue (content_type, content_id, status) VALUES ('creator_content', $1, $2)`)
      .run(result.lastInsertRowid, c.status === 'published' ? 'approved' : 'pending');
  }

  // Business content
  const bizContent = [
    { title: 'Partner with NikeUK this season', body: 'We are looking for grassroots athletes.', budget_range: '£500-£2000', target_sport: 'All' },
    { title: 'Red Bull Creator Challenge 2026', body: 'Show us your best clip and win.', budget_range: '£1000-£5000', target_sport: 'Athletics' },
    { title: 'Gymshark ambassador programme', body: 'Apply to be part of our 2026 team.', budget_range: '£200-£800', target_sport: 'Fitness' },
  ];

  for (let i = 0; i < bizContent.length; i++) {
    const bc = bizContent[i];
    const bizId = bizIds[i % bizIds.length];
    const result = await db.prepare(`INSERT INTO business_content (business_id, title, body, budget_range, target_sport, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`)
      .run(bizId, bc.title, bc.body, bc.budget_range, bc.target_sport);
    await db.prepare(`INSERT INTO moderation_queue (content_type, content_id, status) VALUES ('business_content', $1, 'pending')`)
      .run(result.lastInsertRowid);
  }

  // Opportunities
  const opps = [
    { type: 'creator', title: 'Looking for football collab', description: 'Want to film skills content with another creator in London.', sport: 'Football', location: 'London', budget: 'Unpaid/exposure' },
    { type: 'business', title: 'Brand ambassador — NikeUK', description: 'Seeking 3 creators to rep our new collection.', sport: 'All', location: 'Remote', budget: '£1500' },
    { type: 'creator', title: 'Tennis doubles partner for YouTube', description: 'Filming doubles match for a YouTube series.', sport: 'Tennis', location: 'Birmingham', budget: 'Revenue share' },
    { type: 'business', title: 'Red Bull filming crew', description: 'We need a videographer for our October event.', sport: 'Athletics', location: 'Manchester', budget: '£3000' },
    { type: 'business', title: 'Gymshark content week', description: 'Join us for a content creation week at our HQ.', sport: 'Fitness', location: 'Birmingham', budget: '£500 + kit' },
  ];

  for (const opp of opps) {
    const posted_by_id = opp.type === 'creator' ? creatorIds[0] : bizIds[0];
    await db.prepare(`INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget) VALUES ($1, $2, $3, $4, $5, $6, $7)`)
      .run(opp.type, posted_by_id, opp.title, opp.description, opp.sport, opp.location, opp.budget);
  }
}

module.exports = seed;
