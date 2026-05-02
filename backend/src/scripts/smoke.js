/**
 * smoke.js — lightweight smoke test for PLXYGROUND backend
 * Verifies the server boots and core routes respond correctly.
 * Run via: node backend/src/scripts/smoke.js
 */

import http from 'http';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3011';
const TIMEOUT = 10000;

let passed = 0;
let failed = 0;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 3011,
      path: url.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error(`Request to ${path} timed out after ${TIMEOUT}ms`));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runSmoke() {
  console.log('\n🔥 PLXYGROUND Smoke Tests\n');

  await test('GET / returns API info', async () => {
    const res = await request('/');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.name === 'PLXYGROUND API', 'Missing API name');
  });

  await test('GET /healthz returns ok', async () => {
    const res = await request('/healthz');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'ok', 'Health status not ok');
    assert(typeof res.body.uptime === 'number', 'Missing uptime');
  });

  await test('GET /api/content returns feed', async () => {
    const res = await request('/api/content');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), 'Expected data array');
    assert(typeof res.body.total === 'number', 'Missing total');
  });

  await test('GET /api/opportunities returns list', async () => {
    const res = await request('/api/opportunities');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), 'Expected data array');
  });

  await test('GET /api/creators returns list', async () => {
    const res = await request('/api/creators');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), 'Expected data array');
  });

  await test('POST /api/auth/login with bad credentials returns 401', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'notreal@test.com', password: 'wrongpass' },
    });
    assert(res.status === 401 || res.status === 400, `Expected 401 or 400, got ${res.status}`);
  });

  await test('POST /api/admin/auth/login with bad credentials returns 401', async () => {
    const res = await request('/api/admin/auth/login', {
      method: 'POST',
      body: { email: 'notreal@admin.com', password: 'wrongpass' },
    });
    assert(res.status === 401 || res.status === 400, `Expected 401 or 400, got ${res.status}`);
  });

  await test('Protected route /api/auth/me returns 401 without token', async () => {
    const res = await request('/api/auth/me');
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Protected route /api/admin/queue returns 403 without token', async () => {
    const res = await request('/api/admin/queue');
    assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSmoke().catch((err) => {
  console.error('Smoke test runner crashed:', err.message);
  process.exit(1);
});
