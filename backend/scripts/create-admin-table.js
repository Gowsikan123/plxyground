'use strict';
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const sql = neon(process.env.DATABASE_URL_UNPOOLED);

(async () => {
  // Create admin_users table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('Table ready.');

  const EMAIL = 'admin@plxyground.com';
  const PASSWORD = 'Admin1234!';
  const hash = await bcrypt.hash(PASSWORD, 12);

  await sql`
    INSERT INTO admin_users (email, password_hash, role)
    VALUES (${EMAIL}, ${hash}, 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
  `;
  console.log('Admin user created/updated:', EMAIL);
})().catch(err => { console.error(err.message); process.exit(1); });
