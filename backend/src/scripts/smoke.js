'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const BASE = `http://localhost:${process.env.PORT || 3011}`;

async function run() {
  const results = [];

  async function check(label, method, path, body, expectStatus = 200) {
    try {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${BASE}${path}`, opts);
      const data = await res.json();
      const ok = res.status === expectStatus && data.success !== false;
      results.push({ label, status: res.status, ok, detail: ok ? 'PASS' : `FAIL (expected ${expectStatus}, got ${res.status})` });
      if (!ok) process.stdout.write(`  FAIL: ${label} — status ${res.status}\n`);
    } catch (err) {
      results.push({ label, ok: false, detail: err.message });
      process.stdout.write(`  ERROR: ${label} — ${err.message}\n`);
    }
  }

  process.stdout.write('Running smoke tests...\n');
  await check('GET /', 'GET', '/');
  await check('GET /healthz', 'GET', '/healthz');
  await check('GET /api/content', 'GET', '/api/content');
  await check('GET /api/creators', 'GET', '/api/creators');
  await check('GET /api/opportunities', 'GET', '/api/opportunities');
  await check('POST /api/auth/login (valid)', 'POST', '/api/auth/login', { email: 'jayden.hoops@plxyground.local', password: 'Password1!' });
  await check('POST /api/auth/login (invalid)', 'POST', '/api/auth/login', { email: 'fake@x.com', password: 'nope' }, 401);
  await check('POST /api/admin/auth/login (valid)', 'POST', '/api/admin/auth/login', { email: 'admin@plxyground.local', password: 'Internet2026@' });
  await check('GET /api/admin/analytics (no token)', 'GET', '/api/admin/analytics', null, 401);

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  process.stdout.write(`\nSmoke tests complete: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

run();
