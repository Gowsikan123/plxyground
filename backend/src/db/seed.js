'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./client');
const logger = require('../logger');

async function runSeed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adminHash = await bcrypt.hash('Internet2026@', 12);
    await client.query(
      'INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      ['admin@plxyground.local', adminHash]
    );

    const userHash = await bcrypt.hash('Password1!', 12);

    const creatorsData = [
      { username: 'jayden_hoops', display_name: 'Jayden Williams', sport: 'Basketball', location: 'London, UK', bio: 'Professional basketball player turned content creator. Sharing my journey from the courts of South London to the big leagues.', slug: 'jayden-hoops' },
      { username: 'marcus_fc', display_name: 'Marcus Thompson', sport: 'Football', location: 'Manchester, UK', bio: 'Semi-pro footballer and fitness coach. Passionate about grassroots football development across the UK.', slug: 'marcus-fc' },
      { username: 'serena_ace', display_name: 'Serena Clarke', sport: 'Tennis', location: 'Birmingham, UK', bio: 'LTA-certified tennis coach and competitive player. Helping the next generation find their serve.', slug: 'serena-ace' },
      { username: 'sprint_king_99', display_name: 'Kwame Asante', sport: 'Athletics', location: 'Bristol, UK', bio: 'Track and field athlete specialising in 100m and 200m sprint events. Training diary and race highlights.', slug: 'sprint-king-99' },
      { username: 'boxing_bella', display_name: 'Isabella Reyes', sport: 'Boxing', location: 'Leeds, UK', bio: 'Amateur boxing champion turned professional. Fighting my way to the top one round at a time.', slug: 'boxing-bella' },
    ];

    const creatorIds = [];
    for (const c of creatorsData) {
      const r = await client.query(
        `INSERT INTO creators (username, slug, display_name, bio, sport, location, follower_count, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (username) DO UPDATE SET username=EXCLUDED.username
         RETURNING id`,
        [c.username, c.slug, c.display_name, c.bio, c.sport, c.location, Math.floor(Math.random() * 5000) + 200, true]
      );
      const creatorId = r.rows[0].id;
      creatorIds.push(creatorId);
      await client.query(
        `INSERT INTO creator_accounts (creator_id, email, password_hash, is_email_verified)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (email) DO NOTHING`,
        [creatorId, `${c.username}@plxyground.local`, userHash]
      );
    }

    const businessData = [
      { company_name: 'Nike Sport UK', email: 'nike@plxyground.local', slug: 'nike-sport-uk', industry: 'Sports', bio: 'Empowering athletes across the UK with premium sports equipment and apparel.', website: 'https://nike.com', location: 'London, UK' },
      { company_name: 'Puma Apparel', email: 'puma@plxyground.local', slug: 'puma-apparel', industry: 'Apparel', bio: 'Fashion-forward sportswear for every athlete at every level.', website: 'https://puma.com', location: 'Manchester, UK' },
      { company_name: 'BoltFuel Energy', email: 'boltfuel@plxyground.local', slug: 'boltfuel-energy', industry: 'Nutrition', bio: 'Clean energy drinks designed by athletes for athletes. No nonsense, maximum performance.', website: 'https://boltfuel.co.uk', location: 'Bristol, UK' },
    ];

    const businessIds = [];
    for (const b of businessData) {
      const r = await client.query(
        `INSERT INTO businesses (email, password_hash, company_name, slug, bio, industry, website, location, is_email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email
         RETURNING id`,
        [b.email, userHash, b.company_name, b.slug, b.bio, b.industry, b.website, b.location]
      );
      businessIds.push(r.rows[0].id);
    }

    const contentData = [
      { idx: 0, title: 'My first dunk at 16 — the story behind the moment', body: 'I remember it like it was yesterday. The gym was empty, just me and a worn-out ball. I had been practising my approach for weeks, obsessing over every step of the run-up. Then one Tuesday evening, it just clicked. The crowd was non-existent but in my head it roared. That moment changed everything for me.', status: 'published', tags: ['basketball', 'motivation'] },
      { idx: 0, title: 'Why footwork is the most underrated skill in basketball', body: 'Everyone wants to talk about shooting percentages and three-point ranges but no one discusses footwork enough. The great players — Jordan, Kobe, Giannis — they all had elite footwork. I spend 30 minutes every training session just on lateral movement. Here is my full footwork drill routine.', status: 'published', tags: ['basketball', 'training'] },
      { idx: 1, title: 'Grassroots football changed my life — here is why it matters', body: 'Before the academies, before the scouts, before any of that, there were the Sunday leagues. Muddy pitches in November, hand-me-down boots, and a passion that no amount of money could manufacture. Grassroots football is the soul of the game and we need to protect it at all costs.', status: 'published', tags: ['football', 'community'] },
      { idx: 1, title: 'My 5-day pre-season fitness programme for footballers', body: 'Pre-season is where champions are made. I have been running this programme for three years and it has transformed my endurance and speed. Day one focuses on aerobic base building. Days two and three are high-intensity intervals. Day four is technical drills. Day five is a full recovery session with stretching and nutrition focus.', status: 'published', tags: ['football', 'fitness'] },
      { idx: 2, title: 'How I improved my serve speed by 25 mph in one year', body: 'Serving is the one shot in tennis you have complete control over. Nobody can take that away from you. I worked with a biomechanics coach for six months analysing my trophy position, my ball toss, and my contact point. The results were dramatic. Here is the exact process we followed.', status: 'published', tags: ['tennis', 'technique'] },
      { idx: 2, title: 'Mental resilience on the tennis court — lessons from three years of competition', body: 'Losing a tiebreak at 6-5 used to devastate me for days. Now I treat every point as its own match. The mental side of tennis is as demanding as the physical, and most amateur players completely neglect it. These are the three mental frameworks that transformed my game.', status: 'published', tags: ['tennis', 'mindset'] },
      { idx: 3, title: 'Breaking 10.5 seconds — my training diary', body: 'For two years my personal best in the 100m was stuck at 10.71. I knew I had more in the tank but something was holding me back. I changed my strength coach, overhauled my nutrition, and rebuilt my start mechanics from scratch. Six months later I ran 10.48. This is that journey.', status: 'published', tags: ['athletics', 'sprint'] },
      { idx: 3, title: 'Nutrition for sprinters — what I eat in a training week', body: 'You cannot outrun a bad diet. I learned this the hard way after a season of poor performances that I eventually traced back to inadequate carbohydrate intake around training. Now I track my macros meticulously. Here is a full week of meals during a high-volume training block.', status: 'pending', tags: ['athletics', 'nutrition'] },
      { idx: 4, title: 'My road to my first professional fight', body: 'Three amateur titles. Countless sparring sessions. Hundreds of early mornings. The road to turning professional in boxing is not glamorous. It is gritty, lonely, and brutally demanding. But standing in that ring for my first professional bout, every sacrifice made complete sense.', status: 'pending', tags: ['boxing', 'journey'] },
      { idx: 4, title: 'Defence first — the principles that protect me in the ring', body: 'Attack wins fights but defence wins careers. I have studied the defensive styles of Floyd Mayweather, Pernell Whitaker, and Willie Pep exhaustively. Their footwork, their shoulder rolls, their head movement — I break it all down and explain how I incorporate these principles into my own style.', status: 'pending', tags: ['boxing', 'technique'] },
    ];

    for (const c of contentData) {
      const r = await client.query(
        `INSERT INTO content (creator_id, title, body, tags, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [creatorIds[c.idx], c.title, c.body, JSON.stringify(c.tags), c.status]
      );
      if (c.status === 'pending') {
        await client.query(
          `INSERT INTO moderation_queue (content_type, content_id) VALUES ('creator_content', $1)`,
          [r.rows[0].id]
        );
      }
    }

    const bizContentData = [
      { idx: 0, title: 'Nike x PLXYGROUND — Creator Sponsorship Campaign', body: 'We are looking for UK-based sport creators to partner with Nike for our summer 2026 campaign. Selected creators will receive product packages and paid promotion fees.', budget_range: '£2k-£10k', target_sport: 'Basketball', status: 'published' },
      { idx: 1, title: 'Puma Apparel — Football Creator Collaboration', body: 'Puma is searching for authentic football content creators to feature in our grassroots campaign. We value real stories over polished production.', budget_range: '£500-£2k', target_sport: 'Football', status: 'published' },
      { idx: 2, title: 'BoltFuel Energy — Athlete Brand Ambassadors Wanted', body: 'We are expanding our ambassador programme and looking for athletes across all sports to authentically represent BoltFuel in their training content.', budget_range: '£500-£2k', target_sport: null, status: 'pending' },
    ];

    for (const b of bizContentData) {
      const r = await client.query(
        `INSERT INTO business_content (business_id, title, body, budget_range, target_sport, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [businessIds[b.idx], b.title, b.body, b.budget_range, b.target_sport, b.status]
      );
      if (b.status === 'pending') {
        await client.query(
          `INSERT INTO moderation_queue (content_type, content_id) VALUES ('business_content', $1)`,
          [r.rows[0].id]
        );
      }
    }

    const opportunityData = [
      { type: 'business', idx: 0, title: 'Seeking Basketball Content Creators for Summer Campaign', description: 'Nike is partnering with authentic basketball creators in the UK for a major summer campaign. We need creators who can produce high-quality video content from training sessions and games. Compensation is competitive.', sport: 'Basketball', location: 'London, UK', budget: '£3,000 - £8,000', deadline: '2026-06-30' },
      { type: 'business', idx: 1, title: 'Football Grassroots Documentary Partners Wanted', description: 'Puma is producing a documentary series on UK grassroots football. We are looking for creators embedded in local football communities who can provide authentic behind-the-scenes content throughout the season.', sport: 'Football', location: 'Nationwide, UK', budget: '£1,500 - £4,000', deadline: '2026-07-15' },
      { type: 'creator', idx: 0, title: 'Looking for Brand Partners — Basketball Creator with 3k+ Followers', description: 'I am a professional basketball creator based in London with an engaged audience of over 3,000 followers. I am looking to partner with sports brands for authentic product integrations. Please reach out if interested.', sport: 'Basketball', location: 'London, UK', budget: 'Negotiable', deadline: '2026-06-01' },
      { type: 'creator', idx: 2, title: 'Tennis Coaching Brand Partnership Opportunity', description: 'LTA-certified tennis coach and content creator seeking brand partnership with a racket or equipment manufacturer. My audience is primarily intermediate adult players looking to improve their game.', sport: 'Tennis', location: 'Birmingham, UK', budget: '£500+', deadline: '2026-05-31' },
      { type: 'business', idx: 2, title: 'BoltFuel Energy — Athlete Ambassadors Across All Sports', description: 'BoltFuel Energy is expanding its ambassador network. We are looking for athletes and sports creators across all disciplines who align with our values of clean performance and authentic training. Flexible commission and product compensation.', sport: null, location: 'UK-wide', budget: 'Commission + Product', deadline: '2026-12-31' },
    ];

    for (const o of opportunityData) {
      const posterId = o.type === 'business' ? businessIds[o.idx] : creatorIds[o.idx];
      await client.query(
        `INSERT INTO opportunities (posted_by_type, posted_by_id, title, description, sport, location, budget, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [o.type, posterId, o.title, o.description, o.sport, o.location, o.budget, o.deadline]
      );
    }

    await client.query('COMMIT');
    logger.info('Database seeded successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Seed failed', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runSeed };

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
