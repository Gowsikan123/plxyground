/**
 * Seed script — creates 3 creator accounts and 3 business accounts.
 * Run from the backend directory: node scripts/seed.js
 */

const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3011';

const creators = [
  { name: 'Alex Rivera',   email: 'creator1@plxyground.local', password: 'Password1!', bio: 'Sports & fitness content creator', location: 'London, UK' },
  { name: 'Jamie Chen',    email: 'creator2@plxyground.local', password: 'Password1!', bio: 'Lifestyle and travel creator',      location: 'Manchester, UK' },
  { name: 'Sam Okafor',    email: 'creator3@plxyground.local', password: 'Password1!', bio: 'Tech reviews and gaming content',   location: 'Birmingham, UK' },
];

const businesses = [
  { organizationName: 'NovaSport Ltd',    email: 'business1@plxyground.local', password: 'Password1!', bio: 'Sports equipment brand', location: 'London, UK' },
  { organizationName: 'TrendFlow Agency', email: 'business2@plxyground.local', password: 'Password1!', bio: 'Digital marketing agency', location: 'Leeds, UK' },
  { organizationName: 'GreenEats Co',     email: 'business3@plxyground.local', password: 'Password1!', bio: 'Sustainable food brand',   location: 'Bristol, UK' },
];

async function post(path, body) {
  const res = await fetch(`${backendUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log(`Seeding against ${backendUrl}\n`);

  console.log('--- CREATORS ---');
  for (const c of creators) {
    const { status, data } = await post('/api/auth/signup', c);
    if (status === 201) {
      console.log(`✓ ${c.email}`);
    } else if (data.error && data.error.toLowerCase().includes('exist')) {
      console.log(`~ ${c.email} (already exists)`);
    } else {
      console.log(`✗ ${c.email} — ${data.error || JSON.stringify(data)}`);
    }
  }

  console.log('\n--- BUSINESSES ---');
  for (const b of businesses) {
    const { status, data } = await post('/api/business/auth/signup', b);
    if (status === 201) {
      console.log(`✓ ${b.email}`);
    } else if (data.error && data.error.toLowerCase().includes('exist')) {
      console.log(`~ ${b.email} (already exists)`);
    } else {
      console.log(`✗ ${b.email} — ${data.error || JSON.stringify(data)}`);
    }
  }

  console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
