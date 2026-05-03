'use strict';
const http = require('http');

const BASE = `http://localhost:3011`;
let pass = 0;
let fail = 0;

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 3011,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', () => resolve({ status: 0, body: {} }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function check(label, condition) {
  if (condition) {
    process.stdout.write(`  \u2713 ${label}\n`);
    pass++;
  } else {
    process.stdout.write(`  \u2717 ${label}\n`);
    fail++;
  }
}

async function run() {
  process.stdout.write('\n=== PLXYGROUND SMOKE TESTS ===\n\n');

  const health = await req('GET', '/healthz');
  check('GET /healthz → success', health.body.success === true);

  const root = await req('GET', '/');
  check('GET / → PLXYGROUND API', root.body.name === 'PLXYGROUND API');

  const login = await req('POST', '/api/auth/login', { email: 'jayden@example.com', password: 'Password1!' });
  check('POST /api/auth/login → token', !!login.body.data?.token);
  const creatorToken = login.body.data?.token;

  const me = await req('GET', '/api/auth/me', null, creatorToken);
  check('GET /api/auth/me → username', !!me.body.data?.username);

  const feed = await req('GET', '/api/content');
  check('GET /api/content → posts array', Array.isArray(feed.body.data?.posts));

  const creatorsRes = await req('GET', '/api/creators');
  check('GET /api/creators → data array', Array.isArray(creatorsRes.body.data?.data));

  const oppsRes = await req('GET', '/api/opportunities');
  check('GET /api/opportunities → data array', Array.isArray(oppsRes.body.data?.data));

  const adminLogin = await req('POST', '/api/admin/auth/login', { email: 'admin@plxyground.local', password: 'Internet2026@' });
  check('POST /api/admin/auth/login → token', !!adminLogin.body.data?.token);
  const adminToken = adminLogin.body.data?.token;

  const analytics = await req('GET', '/api/admin/analytics', null, adminToken);
  check('GET /api/admin/analytics → total_creators', analytics.body.data?.total_creators >= 0);

  const queue = await req('GET', '/api/admin/queue', null, adminToken);
  check('GET /api/admin/queue → data array', Array.isArray(queue.body.data?.data));

  process.stdout.write(`\n===========================\n`);
  process.stdout.write(`  PASSED: ${pass}\n`);
  process.stdout.write(`  FAILED: ${fail}\n`);
  process.stdout.write(`===========================\n\n`);

  process.exit(fail > 0 ? 1 : 0);
}

run();
