'use strict';

const bcrypt = require('bcrypt');
const db = require('./client');
const logger = require('../logger');
const config = require('../config');

const ADMIN = {
  username: 'admin',
  email: 'admin@plxyground.com',
  password: 'Admin@Plxy2025!',
  display_name: 'PLXYGROUND Admin',
  role: 'admin',
  slug: 'admin',
};

const CREATORS = [
  { username: 'jamal_baller',   email: 'jamal@plxy.dev',   password: 'Creator1!', display_name: 'Jamal Baller',    sport: 'basketball', position: 'PG', location: 'London' },
  { username: 'zara_scores',    email: 'zara@plxy.dev',    password: 'Creator2!', display_name: 'Zara Scores',     sport: 'football',   position: 'ST', location: 'Manchester' },
  { username: 'kai_runnit',     email: 'kai@plxy.dev',     password: 'Creator3!', display_name: 'Kai Runnit',      sport: 'athletics',  position: '100m', location: 'Birmingham' },
  { username: 'priya_net',      email: 'priya@plxy.dev',   password: 'Creator4!', display_name: 'Priya Net',       sport: 'tennis',     position: 'Baseline', location: 'Leeds' },
  { username: 'dev_hoops',      email: 'dev@plxy.dev',     password: 'Creator5!', display_name: 'Dev Hoops',       sport: 'basketball', position: 'SG', location: 'Bristol' },
];

const BUSINESSES = [
  { email: 'nike@brands.dev',   password: 'Brand1!', company_name: 'Nike UK',      industry: 'Sportswear' },
  { email: 'puma@brands.dev',   password: 'Brand2!', company_name: 'Puma Europe',   industry: 'Footwear' },
  { email: 'redbull@brands.dev',password: 'Brand3!', company_name: 'Red Bull Media', industry: 'Media' },
];

async function seedDatabase() {
  const { rows } = await db.query('SELECT COUNT(*) AS cnt FROM users');
  if (parseInt(rows[0].cnt, 10) > 0) {
    logger.info('seed: users already exist — skipping seed');
    return;
  }

  logger.info('seed: starting database seed...');
  const rounds = config.bcrypt.rounds;

  const adminHash = await bcrypt.hash(ADMIN.password, rounds);
  await db.query(
    `INSERT INTO users (username, email, password_hash, display_name, role, slug, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
    [ADMIN.username, ADMIN.email, adminHash, ADMIN.display_name, ADMIN.role, ADMIN.slug]
  );
  logger.info('seed: admin created');

  const creatorIds = [];
  for (const c of CREATORS) {
    const hash = await bcrypt.hash(c.password, rounds);
    const slug = c.username.replace(/_/g, '-');
    const { rows: r } = await db.query(
      `INSERT INTO users (username, email, password_hash, display_name, sport, position, location, slug, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'creator', TRUE)
       RETURNING id`,
      [c.username, c.email, hash, c.display_name, c.sport, c.position, c.location, slug]
    );
    creatorIds.push(r[0].id);
  }
  logger.info('seed: creators created', { count: CREATORS.length });

  const bizIds = [];
  for (const b of BUSINESSES) {
    const hash = await bcrypt.hash(b.password, rounds);
    const { rows: r } = await db.query(
      `INSERT INTO businesses (email, password_hash, company_name, industry, is_verified)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id`,
      [b.email, hash, b.company_name, b.industry]
    );
    bizIds.push(r[0].id);
  }
  logger.info('seed: businesses created', { count: BUSINESSES.length });

  const contentSamples = [
    { title: 'First Day Back',          body: 'Hit the court early today — grind never stops.',      sport: 'basketball', tags: ['training','grind'] },
    { title: 'Match Day Highlights',    body: 'Scored twice in today\'s five-a-side. Buzzing.',       sport: 'football',   tags: ['matchday','goals'] },
    { title: 'PB at 100m',              body: 'New personal best: 10.8 seconds. Onwards.',            sport: 'athletics',  tags: ['pb','sprint'] },
    { title: 'Serving Up Heat',         body: 'Aced 12 in a row during practice today.',              sport: 'tennis',     tags: ['serve','practice'] },
    { title: 'Gym Session Complete',    body: 'Leg day is not a suggestion. It\'s a lifestyle.',      sport: 'basketball', tags: ['gym','legs'] },
    { title: 'Pre-Season Begins',       body: 'Camp starts tomorrow — team is looking sharp.',        sport: 'football',   tags: ['preseason','team'] },
    { title: 'Recovery Day',            body: 'Ice bath, stretch, sleep. The unsexy side of sport.', sport: 'athletics',  tags: ['recovery'] },
    { title: 'Doubles Practice',        body: 'Working the net game with a new partner.',             sport: 'tennis',     tags: ['doubles','net'] },
    { title: 'Breakdown Film Session',  body: 'Watched back last week\'s game — lots to fix.',       sport: 'basketball', tags: ['film','analysis'] },
    { title: 'End of Week Check-In',    body: '5 sessions done, nutrition on point. Ready.',          sport: 'football',   tags: ['weekly','fitness'] },
  ];

  for (let i = 0; i < contentSamples.length; i++) {
    const c = contentSamples[i];
    const userId = creatorIds[i % creatorIds.length];
    await db.query(
      `INSERT INTO content (user_id, title, body, sport, tags, status, media_type)
       VALUES ($1, $2, $3, $4, $5, 'approved', 'none')`,
      [userId, c.title, c.body, c.sport, c.tags]
    );
  }
  logger.info('seed: content created', { count: contentSamples.length });

  const oppSamples = [
    { title: 'Basketball Brand Ambassador',  description: 'Seeking UK basketball creators for year-long brand deal.',  sport: 'basketball', budget_min: 500,  budget_max: 2000  },
    { title: 'Footwear Launch Campaign',     description: 'Looking for 3 creators to front our new running shoe.',      sport: 'athletics',  budget_min: 800,  budget_max: 3000  },
    { title: 'Match Day Content Series',     description: 'Weekly football content for our social channels.',           sport: 'football',   budget_min: 200,  budget_max: 800   },
    { title: 'Energy Drink Partnership',     description: 'Multi-sport ambassadors wanted for 6-month campaign.',       sport: null,         budget_min: 1000, budget_max: 5000  },
    { title: 'Tennis Academy Promo',         description: 'Promote our summer tennis camps to your audience.',          sport: 'tennis',     budget_min: 300,  budget_max: 1200  },
  ];

  for (let i = 0; i < oppSamples.length; i++) {
    const o = oppSamples[i];
    const bizId = bizIds[i % bizIds.length];
    await db.query(
      `INSERT INTO opportunities (business_id, title, description, sport, budget_min, budget_max, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'GBP', 'open')`,
      [bizId, o.title, o.description, o.sport, o.budget_min, o.budget_max]
    );
  }
  logger.info('seed: opportunities created', { count: oppSamples.length });

  logger.info('seed: database seed complete ✓');
}

module.exports = { seedDatabase };
