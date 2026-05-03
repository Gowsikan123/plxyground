'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const config = require('../config');

const BASE = `http://localhost:${config.PORT}`;

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function run() {
  let passed = 0;
  let failed = 0;

  function assert(label, condition, detail = '') {
    if (condition) {
      process.stdout.write(`  ✓ ${label}\n`);
      passed++;
    } else {
      process.stderr.write(`  ✗ ${label}${detail ? ' — ' + detail : ''}\n`);
      failed++;
    }
  }

  process.stdout.write('\n[SMOKE] PLXYGROUND API\n\n');

  let r;

  r = await req('GET', '/healthz');
  assert('GET /healthz returns 200', r.status === 200);
  assert('healthz has status ok', r.json.status === 'ok');

  r = await req('GET', '/');
  assert('GET / returns API name', r.json.name === 'PLXYGROUND API');

  r = await req('POST', '/api/auth/login', { email: 'jayden.hoops@example.com', password: 'Password1!' });
  assert('Creator login succeeds', r.status === 200, JSON.stringify(r.json));
  const creatorToken = r.json.data?.token;
  assert('Creator login returns token', !!creatorToken);

  r = await req('GET', '/api/auth/me', null, creatorToken);
  assert('GET /api/auth/me returns user', r.status === 200 && r.json.data?.username === 'jayden_hoops');

  r = await req('GET', '/api/content');
  assert('GET /api/content returns posts array', Array.isArray(r.json.data?.posts));

  r = await req('GET', '/api/creators');
  assert('GET /api/creators returns creators array', Array.isArray(r.json.data?.creators));

  r = await req('GET', '/api/opportunities');
  assert('GET /api/opportunities returns array', Array.isArray(r.json.data?.opportunities));

  r = await req('POST', '/api/admin/auth/login', { email: 'admin@plxyground.local', password: 'Internet2026@' });
  assert('Admin login succeeds', r.status === 200, JSON.stringify(r.json));
  const adminToken = r.json.data?.token;
  assert('Admin login returns token', !!adminToken);

  r = await req('GET', '/api/admin/analytics', null, adminToken);
  assert('GET /api/admin/analytics returns KPIs', r.status === 200 && typeof r.json.data?.total_creators === 'number');

  r = await req('GET', '/api/admin/queue', null, adminToken);
  assert('GET /api/admin/queue returns items', r.status === 200 && Array.isArray(r.json.data?.items));

  r = await req('GET', '/api/admin/users', null, adminToken);
  assert('GET /api/admin/users returns users', r.status === 200 && Array.isArray(r.json.data?.users));

  process.stdout.write(`\n[SMOKE] ${passed} passed, ${failed} failed\n\n`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  process.stderr.write(`[SMOKE] Fatal: ${err.message}\n`);
  process.exit(1);
});
