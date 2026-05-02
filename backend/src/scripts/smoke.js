'use strict';
const http = require('http');

const PORT = process.env.PORT || 3011;

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const health = await get('/health');
    if (health.status !== 200) throw new Error(`/health returned ${health.status}`);
    process.stdout.write('[SMOKE] /health OK\n');

    const feed = await get('/api/content');
    if (feed.status !== 200) throw new Error(`/api/content returned ${feed.status}`);
    process.stdout.write('[SMOKE] /api/content OK\n');

    const opps = await get('/api/opportunities');
    if (opps.status !== 200) throw new Error(`/api/opportunities returned ${opps.status}`);
    process.stdout.write('[SMOKE] /api/opportunities OK\n');

    process.stdout.write('[SMOKE] All checks passed.\n');
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[SMOKE FAIL] ${err.message}\n`);
    process.exit(1);
  }
}

run();
