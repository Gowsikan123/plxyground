'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3012;
const FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  fs.readFile(FILE, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Error loading admin panel');
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`PLXYGROUND Admin Panel running on http://localhost:${PORT}`);
});
