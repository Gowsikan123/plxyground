'use strict';
const http = require('http');
const path = require('path');
const handler = require('serve-handler');

const PORT = process.env.ADMIN_PORT || 3012;

const server = http.createServer((req, res) => {
  handler(req, res, {
    public: path.join(__dirname),
    rewrites: [{ source: '**', destination: '/index.html' }],
    headers: [
      { source: '**', headers: [{ key: 'X-Frame-Options', value: 'DENY' }, { key: 'X-Content-Type-Options', value: 'nosniff' }] },
    ],
  });
});

server.listen(PORT, () => {
  process.stdout.write(`[admin] running at http://localhost:${PORT}\n`);
});
