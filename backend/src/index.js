'use strict';
require('dotenv').config();
const config = require('./config');
const logger = require('./logger');
const { setupDatabase } = require('./db/setup');

setupDatabase();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));
app.use(cors({ origin: config.CORS_ORIGIN.split(',').map(o => o.trim()) }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// Health + root
app.get('/healthz', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});
app.get('/', (req, res) => {
  res.json({ success: true, name: 'PLXYGROUND API', version: '1.0.0' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/business', require('./routes/businessAuth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/creators', require('./routes/creators'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/queue', require('./routes/admin/queue'));
app.use('/api/admin/content', require('./routes/admin/content'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/analytics', require('./routes/admin/analytics'));
app.use('/api/admin/audit', require('./routes/admin/audit'));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(config.PORT, () => {
  logger.info(`PLXYGROUND API listening on port ${config.PORT} [${config.NODE_ENV}]`);
});
