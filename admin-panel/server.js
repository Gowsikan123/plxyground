'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.ADMIN_PORT || 3012;

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading admin panel');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  process.stdout.write(`Admin panel running at http://localhost:${PORT}\n`);
});
