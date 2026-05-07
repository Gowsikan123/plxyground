'use strict';
require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.local' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

const creators = [
  { email: 'jayden@example.com', username: 'jayden', display_name: 'Jayden Carter', sport: 'Basketball', location: 'London' },
  { email: 'emma@example.com',   username: 'emma',   display_name: 'Emma Singh',    sport: 'Athletics', location: 'Manchester' },
  { email: 'kai@example.com',    username: 'kai',    display_name: 'Kai Thompson',  sport: 'Football',  location: 'Birmingham' },
  { email: 'sara@example.com',   username: 'sara',   display_name: 'Sara Okafor',   sport: 'Tennis',    location: 'Leeds' },
  { email: 'leo@example.com',    username: 'leo',    display_name: 'Leo Martinez',  sport: 'Boxing',    location: 'Liverpool' },
];

const businesses = [
  { email: 'contact@peakgear.com',        password_hash: '', company_name: 'Peak Gear',      slug: 'peak-gear',      industry: 'Sports Equipment' },
  { email: 'hello@fuelup.io',             password_hash: '', company_name: 'FuelUp Nutrition', slug: 'fuelup-nutrition', industry: 'Nutrition' },
  { email: 'partnerships@sportsmedia.co', password_hash: '', company_name: 'Sports Media Co', slug: 'sports-media-co', industry: 'Media' },
];

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Seeding database...');

  const password = 'Password1!';
  const hash = await bcrypt.hash(password, 12);

  // Seed creators
  for (const c of creators) {
    try {
      const res = await client.query(
        `INSERT INTO creators (username, slug, display_name, sport, location)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO UPDATE SET display_name=EXCLUDED.display_name
         RETURNING id`,
        [c.username, c.username, c.display_name, c.sport, c.location]
      );
      const creatorId = res.rows[0].id;
      await client.query(
        `INSERT INTO creator_accounts (creator_id, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash`,
        [creatorId, c.email, hash]
      );
      console.log(`  Creator: ${c.email}`);
    } catch (err) {
      console.error(`  FAILED ${c.email}:`, err.message);
    }
  }

  // Seed businesses
  for (const b of businesses) {
    try {
      await client.query(
        `INSERT INTO businesses (email, password_hash, company_name, slug, industry)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash`,
        [b.email, hash, b.company_name, b.slug, b.industry]
      );
      console.log(`  Business: ${b.email}`);
    } catch (err) {
      console.error(`  FAILED ${b.email}:`, err.message);
    }
  }

  console.log('\nDone. All test users seeded with password: Password1!');
  await client.end();
})();
