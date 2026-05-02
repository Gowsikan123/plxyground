'use strict';

const bcrypt = require('bcryptjs');
const pool = require('./client');
const logger = require('../logger');
const slugify = require('../utils/slugify');

const ROUNDS = 12;

async function seed() {
  logger.info('Seeding database...');

  // Admin
  const adminHash = await bcrypt.hash('Admin1234!', ROUNDS);
  await pool.query(
    `INSERT INTO admins (email, passwordhash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
    ['admin@plxyground.com', adminHash]
  );

  // Creators
  const creators = [
    { username: 'jordanhoops',  displayname: 'Jordan Hoops',   sport: 'Basketball', location: 'London, UK' },
    { username: 'sprintqueen',  displayname: 'Sprint Queen',   sport: 'Athletics',  location: 'Manchester, UK' },
    { username: 'boxingkid23',  displayname: 'Boxing Kid',     sport: 'Boxing',     location: 'Birmingham, UK' },
    { username: 'tennisace',    displayname: 'Tennis Ace',     sport: 'Tennis',     location: 'Bristol, UK' },
    { username: 'footballfocus',displayname: 'Football Focus', sport: 'Football',   location: 'Leeds, UK' },
  ];

  for (const c of creators) {
    const slug = await slugify(c.username, 'creators');
    const { rows } = await pool.query(
      `INSERT INTO creators (username, slug, displayname, sport, location)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [c.username, slug, c.displayname, c.sport, c.location]
    );
    if (rows.length > 0) {
      const passwordHash = await bcrypt.hash('Creator1234!', ROUNDS);
      await pool.query(
        `INSERT INTO creator_accounts (creatorid, email, passwordhash)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING`,
        [rows[0].id, `${c.username}@plxyground.com`, passwordHash]
      );
    }
  }

  // Businesses
  const businesses = [
    { companyname: 'SportGear Co',    email: 'sportgear@plxyground.com',   industry: 'Apparel',   location: 'London, UK' },
    { companyname: 'NutriElite',      email: 'nutrielite@plxyground.com',  industry: 'Nutrition', location: 'Manchester, UK' },
    { companyname: 'MediaSport Ltd',  email: 'mediasport@plxyground.com',  industry: 'Media',     location: 'Birmingham, UK' },
  ];

  for (const b of businesses) {
    const slug = await slugify(b.companyname, 'businesses');
    const passwordHash = await bcrypt.hash('Business1234!', ROUNDS);
    await pool.query(
      `INSERT INTO businesses (email, passwordhash, companyname, slug, industry, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [b.email, passwordHash, b.companyname, slug, b.industry, b.location]
    );
  }

  // Content (10 posts for creator id 1 — seeded after creators)
  const { rows: creatorRows } = await pool.query(`SELECT id FROM creators LIMIT 1`);
  if (creatorRows.length > 0) {
    const creatorId = creatorRows[0].id;
    const posts = [
      { title: 'My first dunk ever',        body: 'It was an incredible feeling hitting that first dunk.',   sport: 'Basketball' },
      { title: 'Morning track session',      body: 'Hit a personal best 100m today at 10.8 seconds.',         sport: 'Athletics'  },
      { title: 'Sparring highlights',        body: 'Three rounds of hard sparring with the team.',             sport: 'Boxing'     },
      { title: 'Backhand technique drill',   body: 'Working on my backhand consistency this week.',            sport: 'Tennis'     },
      { title: 'Free kick practice',         body: 'Spent an hour on set pieces — finally nailing them.',      sport: 'Football'   },
      { title: 'Strength training day',      body: 'Squats, deadlifts, and conditioning circuits.',            sport: 'Basketball' },
      { title: 'Speed ladder drills',        body: 'Footwork is everything. Drilled it for 45 minutes.',       sport: 'Athletics'  },
      { title: 'Shadow boxing session',      body: 'Solo session focusing on head movement and combos.',       sport: 'Boxing'     },
      { title: 'Serve and volley practice',  body: 'Improving my net game — coach says massive improvement.',  sport: 'Tennis'     },
      { title: 'Pre-season fitness test',    body: 'Passed all benchmarks. Ready for the season.',             sport: 'Football'   },
    ];

    for (const p of posts) {
      const { rows: contentRows } = await pool.query(
        `INSERT INTO content (creatorid, title, body, tags, status)
         VALUES ($1, $2, $3, $4, 'published')
         RETURNING id`,
        [creatorId, p.title, p.body, JSON.stringify([p.sport.toLowerCase()])]
      );
      await pool.query(
        `INSERT INTO moderation_queue (contenttype, contentid, status, reviewedat)
         VALUES ('creator_content', $1, 'approved', NOW())`,
        [contentRows[0].id]
      );
    }
  }

  // Opportunities (5)
  const opps = [
    { title: 'Basketball Content Creator Wanted',  description: 'Looking for a UK-based basketball creator to produce weekly highlight reels.',   sport: 'Basketball', budget: '£500/month',  location: 'London, UK',      postedbytype: 'business' },
    { title: 'Athletics Brand Ambassador',         description: 'Represent our new running shoe line across social media.',                         sport: 'Athletics',  budget: '£300/month',  location: 'Manchester, UK',  postedbytype: 'business' },
    { title: 'Boxing Coaching Collab',             description: 'Join our youth boxing programme as a featured coach and content creator.',         sport: 'Boxing',     budget: '£200/session', location: 'Birmingham, UK',  postedbytype: 'business' },
    { title: 'Tennis Reel Creator',                description: 'Create short-form tennis content for our social channels.',                        sport: 'Tennis',     budget: '£150/reel',   location: 'Bristol, UK',     postedbytype: 'business' },
    { title: 'Football Skills Collab',             description: 'Partner with us on a skills challenge series for YouTube.',                        sport: 'Football',   budget: '£400/video',  location: 'Leeds, UK',       postedbytype: 'business' },
  ];

  const { rows: bizRows } = await pool.query(`SELECT id FROM businesses LIMIT 1`);
  if (bizRows.length > 0) {
    for (const o of opps) {
      await pool.query(
        `INSERT INTO opportunities (postedbytype, postedbyid, title, description, sport, location, budget)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [o.postedbytype, bizRows[0].id, o.title, o.description, o.sport, o.location, o.budget]
      );
    }
  }

  logger.info('Seed complete');
}

module.exports = seed;
