'use strict';
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const EMAIL = process.env.ADMIN_EMAIL || 'admin@plxyground.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234!';

(async () => {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED);
  const hash = await bcrypt.hash(PASSWORD, 12);
  await sql`
    INSERT INTO admin_users (email, password_hash, role)
    VALUES (${EMAIL}, ${hash}, 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
  `;
  console.log(`Admin user created/updated: ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
})().catch(err => { console.error(err.message); process.exit(1); });
