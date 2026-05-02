'use strict';
const bcrypt = require('bcrypt');
const db = require('./client');
const logger = require('../logger');
const config = require('../config');
const { slugify } = require('../utils/slugify');

async function seed() {
  const adminCount = await db.query('SELECT COUNT(*) FROM admins');
  if (parseInt(adminCount.rows[0].count, 10) > 0) {
    logger.info('Seed skipped — data already exists');
    return;
  }

  logger.info('Seeding database…');
  const rounds = config.bcrypt.rounds;

  // ── Admins ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@plxyground1', rounds);
  await db.query(
    `INSERT INTO admins (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)`,
    ['superadmin', 'admin@plxyground.com', adminHash, 'superadmin'],
  );

  // ── Creators ────────────────────────────────────────────────────────────────
  const creators = [
    { username: 'jordan_hoops',  email: 'jordan@demo.com',  display_name: 'Jordan Hoops',   sport: 'basketball' },
    { username: 'serena_tennis', email: 'serena@demo.com',  display_name: 'Serena Tennis',   sport: 'tennis'     },
    { username: 'kai_football',  email: 'kai@demo.com',     display_name: 'Kai FC',          sport: 'football'   },
    { username: 'mia_track',     email: 'mia@demo.com',     display_name: 'Mia Track Star',  sport: 'athletics'  },
    { username: 'dev_swimmer',   email: 'dev@demo.com',     display_name: 'Dev Swims',       sport: 'swimming'   },
  ];

  const creatorHash = await bcrypt.hash('Creator@demo123', rounds);
  for (const c of creators) {
    const slug = slugify(c.display_name);
    await db.query(
      `INSERT INTO users (username, email, password_hash, display_name, sport, slug)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [c.username, c.email, creatorHash, c.display_name, c.sport, slug],
    );
  }

  // ── Businesses ──────────────────────────────────────────────────────────────
  const businesses = [
    { name: 'NexGen Sports',   email: 'hi@nexgen.com',    industry: 'sportswear'   },
    { name: 'Hydro Energy Co', email: 'hi@hydroenergy.com', industry: 'nutrition'  },
    { name: 'ProKit Gear',     email: 'hi@prokit.com',    industry: 'equipment'    },
  ];

  const bizHash = await bcrypt.hash('Business@demo123', rounds);
  for (const b of businesses) {
    const slug = slugify(b.name);
    await db.query(
      `INSERT INTO businesses (name, email, password_hash, industry, slug)
       VALUES ($1, $2, $3, $4, $5)`,
      [b.name, b.email, bizHash, b.industry, slug],
    );
  }

  // ── Content ─────────────────────────────────────────────────────────────────
  const userRows = await db.query('SELECT id, sport FROM users LIMIT 5');
  const contentItems = [
    { title: 'My first dunk compilation', sport: 'basketball', status: 'approved'  },
    { title: 'Morning serve session',      sport: 'tennis',     status: 'approved'  },
    { title: 'Free kick tutorial',         sport: 'football',   status: 'approved'  },
    { title: '100m sprint breakdown',      sport: 'athletics',  status: 'approved'  },
    { title: 'Butterfly stroke technique', sport: 'swimming',   status: 'approved'  },
    { title: 'Crossover drills',           sport: 'basketball', status: 'pending'   },
    { title: 'Backhand slice masterclass', sport: 'tennis',     status: 'pending'   },
    { title: 'Corner kick analysis',       sport: 'football',   status: 'pending'   },
    { title: 'Long jump warm-up routine',  sport: 'athletics',  status: 'flagged'   },
    { title: 'Open water training vlog',   sport: 'swimming',   status: 'approved'  },
  ];

  for (let i = 0; i < contentItems.length; i++) {
    const user = userRows.rows[i % userRows.rows.length];
    const item = contentItems[i];
    await db.query(
      `INSERT INTO content (user_id, title, sport, tags, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, item.title, item.sport, [item.sport, 'demo'], item.status],
    );
  }

  // ── Opportunities ───────────────────────────────────────────────────────────
  const bizRows = await db.query('SELECT id FROM businesses LIMIT 3');
  const opps = [
    { title: 'Basketball Brand Ambassador',  sport: 'basketball', type: 'ambassador', min: 500,  max: 2000  },
    { title: 'Tennis Gear Collab',           sport: 'tennis',     type: 'collab',     min: 200,  max: 800   },
    { title: 'Football Content Sponsorship', sport: 'football',   type: 'sponsorship',min: 1000, max: 5000  },
    { title: 'Athletics Appearance Fee',     sport: 'athletics',  type: 'appearance', min: 300,  max: 1200  },
    { title: 'Swim Brand Partnership',       sport: 'swimming',   type: 'sponsorship',min: 750,  max: 3000  },
  ];

  for (let i = 0; i < opps.length; i++) {
    const biz = bizRows.rows[i % bizRows.rows.length];
    const o = opps[i];
    await db.query(
      `INSERT INTO opportunities (business_id, title, description, sport, type, budget_min, budget_max, remote_ok, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [biz.id, o.title, `Exciting opportunity for a ${o.sport} creator.`, o.sport, o.type, o.min, o.max, true, 'open'],
    );
  }

  logger.info('Seed complete');
}

module.exports = { seed };
