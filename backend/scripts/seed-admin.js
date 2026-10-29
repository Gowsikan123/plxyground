'use strict';
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const EMAIL = process.env.ADMIN_EMAIL || 'admin@plxyground.com';
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!PASSWORD || PASSWORD.length < 12) {
  console.error('Set ADMIN_PASSWORD (12+ characters) in .env.local before running this script.');
  process.exit(1);
}

(async () => {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED);
  const hash = await bcrypt.hash(PASSWORD, 12);
  await sql`
    INSERT INTO admin_users (email, password_hash, role)
    VALUES (${EMAIL}, ${hash}, 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
  `;
  console.log(`Admin user created/updated: ${EMAIL}`);
})().catch(err => { console.error(err.message); process.exit(1); });
