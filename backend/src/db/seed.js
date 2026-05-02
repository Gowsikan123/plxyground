'use strict';

const bcrypt = require('bcrypt');
const { getPool } = require('./client');
const logger = require('../logger');
const { bcryptRounds } = require('../config');

async function seed() {
  const pool = getPool();

  const { rows: existing } = await pool.query('SELECT COUNT(*) FROM admins');
  if (parseInt(existing[0].count, 10) > 0) {
    logger.info('Seed already applied — skipping');
    return;
  }

  logger.info('Running seed...');

  const adminHash = await bcrypt.hash('Admin@1234!', bcryptRounds);
  await pool.query(
    `INSERT INTO admins (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)`,
    ['superadmin', 'admin@plxyground.io', adminHash, 'superadmin'],
  );

  const creators = [
    { username: 'dunk_king',   email: 'dunk@plxy.io',   display_name: 'Dunk King',      sport: 'Basketball', bio: 'Hoops content creator based in London.' },
    { username: 'sprint_ella', email: 'ella@plxy.io',   display_name: 'Sprint Ella',    sport: 'Athletics',  bio: 'Track athlete & content maker.' },
    { username: 'boxr_mike',   email: 'mike@plxy.io',   display_name: 'Boxr Mike',       sport: 'Boxing',     bio: 'Amateur boxer sharing my journey.' },
    { username: 'swim_deep',   email: 'swim@plxy.io',   display_name: 'Swim Deep',      sport: 'Swimming',   bio: 'Open-water swimmer & vlogger.' },
    { username: 'pitch_felix', email: 'felix@plxy.io',  display_name: 'Pitch Felix',    sport: 'Football',   bio: 'Grassroots football coach & creator.' },
  ];

  const creatorHash = await bcrypt.hash('Creator@1234!', bcryptRounds);
  const creatorIds = [];

  for (const c of creators) {
    const { rows } = await pool.query(
      `INSERT INTO creators (username, email, password_hash, display_name, sport, bio, slug)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [c.username, c.email, creatorHash, c.display_name, c.sport, c.bio, c.username],
    );
    creatorIds.push(rows[0].id);
  }

  const businesses = [
    { company_name: 'ProKit Gear',      email: 'prokit@plxy.io',   website: 'https://prokit.example',  bio: 'Sports equipment for serious athletes.' },
    { company_name: 'Urban Sportswear', email: 'urban@plxy.io',    website: 'https://urban.example',   bio: 'Street-to-stadium performance wear.' },
    { company_name: 'FuelPro Nutrition',email: 'fuel@plxy.io',     website: 'https://fuelpro.example', bio: 'Clean nutrition for peak performance.' },
  ];

  const businessHash = await bcrypt.hash('Business@1234!', bcryptRounds);

  for (const b of businesses) {
    await pool.query(
      `INSERT INTO businesses (company_name, email, password_hash, website, bio, slug)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [b.company_name, b.email, businessHash, b.website, b.bio, b.company_name.toLowerCase().replace(/\s+/g, '-')],
    );
  }

  const posts = [
    { title: 'My first 3-pointer training session', body: 'Spent 2 hours on shooting drills today. Consistency is everything.', sport: 'Basketball', tags: ['training','hoops'],      creator: 0 },
    { title: 'Breaking 11 seconds in the 100m',     body: 'Finally did it after 6 months of dedicated training.',             sport: 'Athletics',  tags: ['sprint','milestone'],     creator: 1 },
    { title: 'Sparring session highlights',          body: 'Worked on defensive movement and counter-punching today.',          sport: 'Boxing',     tags: ['sparring','technique'],   creator: 2 },
    { title: '5km open water swim — Dover coast',   body: 'Cold water challenge complete. Mind over matter.',                  sport: 'Swimming',   tags: ['openwater','challenge'],  creator: 3 },
    { title: 'Weekend grassroots training drills',  body: 'Ran a session with 12 young players on positional awareness.',       sport: 'Football',   tags: ['coaching','grassroots'], creator: 4 },
    { title: 'Ball-handling drills for beginners',  body: 'Simple drills you can do in your driveway every day.',              sport: 'Basketball', tags: ['beginner','skills'],      creator: 0 },
    { title: 'Recovery run tips after a race',      body: 'Active recovery matters just as much as the hard sessions.',         sport: 'Athletics',  tags: ['recovery','tips'],        creator: 1 },
    { title: 'Nutrition before a fight — my stack', body: 'Here is exactly what I eat in the 24 hours before a bout.',         sport: 'Boxing',     tags: ['nutrition','fight'],      creator: 2 },
    { title: 'Breathwork for endurance athletes',   body: 'CO2 tolerance training has transformed my swim times.',              sport: 'Swimming',   tags: ['breathwork','endurance'], creator: 3 },
    { title: 'Building a training pitch on a budget', body: 'How we used grant funding to re-surface our local 5-a-side.',     sport: 'Football',   tags: ['community','pitch'],     creator: 4 },
  ];

  for (const p of posts) {
    await pool.query(
      `INSERT INTO content (creator_id, title, body, sport, tags, status)
       VALUES ($1, $2, $3, $4, $5, 'approved')`,
      [creatorIds[p.creator], p.title, p.body, p.sport, p.tags],
    );
  }

  const opps = [
    { poster_id: creatorIds[0], poster_type: 'creator', title: 'Collab on basketball reel series', description: 'Looking for a female hoop creator for a collab reel campaign.', sport: 'Basketball', budget: '£200-£400', location: 'London', deadline: '2026-07-01' },
    { poster_id: creatorIds[1], poster_type: 'creator', title: 'Co-host a track podcast episode', description: 'Seeking an athletics coach or athlete for a podcast crossover.', sport: 'Athletics', budget: 'Unpaid exposure', location: 'Remote', deadline: '2026-06-15' },
    { poster_id: creatorIds[2], poster_type: 'creator', title: 'Sparring footage partner needed', description: 'Need a partner who can also film and edit sparring clips.', sport: 'Boxing', budget: '£100', location: 'Manchester', deadline: '2026-06-30' },
    { poster_id: creatorIds[3], poster_type: 'creator', title: 'Open water swim buddy — Scotland trip', description: 'Planning a Loch Ness swim and documenting it. Looking for co-creator.', sport: 'Swimming', budget: 'Split costs', location: 'Scotland', deadline: '2026-08-01' },
    { poster_id: creatorIds[4], poster_type: 'creator', title: 'Grassroots football content day', description: 'Organising a content day at our local club. Want 2-3 creators involved.', sport: 'Football', budget: '£150 per creator', location: 'Birmingham', deadline: '2026-07-15' },
  ];

  for (const o of opps) {
    await pool.query(
      `INSERT INTO opportunities (poster_id, poster_type, title, description, sport, budget, location, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [o.poster_id, o.poster_type, o.title, o.description, o.sport, o.budget, o.location, o.deadline],
    );
  }

  logger.info('Seed complete — 1 admin, 5 creators, 3 businesses, 10 posts, 5 opportunities');
}

module.exports = { seed };
