const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3012;
const API_ORIGIN = process.env.BACKEND_URL || 'http://127.0.0.1:3011';

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const target = new URL(req.url, API_ORIGIN);
    const proxyReq = http.request(target, {
      method: req.method,
      headers: {
        ...req.headers,
        host: target.host,
      },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upstream API unavailable' }));
    });

    req.pipe(proxyReq);
    return;
  }

  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Admin panel running on http://localhost:${PORT}`);
});
