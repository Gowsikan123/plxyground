'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const logger = require('./logger');
const { globalLimiter } = require('./middleware/rateLimiter');
const { authLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Logging
app.use(logger.requestMiddleware);

// Rate limiting
app.use(globalLimiter);

// Health
app.get('/healthz', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Routes
app.use('/api/auth',         authLimiter, require('./routes/auth'));
app.use('/api/business',     authLimiter, require('./routes/businessAuth'));
app.use('/api/content',      require('./routes/content'));
app.use('/api/creators',     require('./routes/creators'));
app.use('/api/opportunities',require('./routes/opportunities'));

// Admin routes
app.use('/api/admin/auth',      authLimiter, require('./routes/admin/auth'));
app.use('/api/admin/queue',     require('./routes/admin/queue'));
app.use('/api/admin/users',     require('./routes/admin/users'));
app.use('/api/admin/analytics', require('./routes/admin/analytics'));
app.use('/api/admin/audit',     require('./routes/admin/audit'));
app.use('/api/admin/settings',  require('./routes/admin/settings'));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
