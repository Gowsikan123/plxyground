'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN.split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(globalLimiter);

// Health + root
app.get('/healthz', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.get('/', (_req, res) => res.json({ success: true, name: 'PLXYGROUND API', version: '1.0.0' }));

// Creator / Business routes
app.use('/api/auth',             authLimiter, require('./routes/auth'));
app.use('/api/business',         authLimiter, require('./routes/businessAuth'));
app.use('/api/business/content', require('./routes/businessContent'));
app.use('/api/content',          require('./routes/content'));
app.use('/api/creators',         require('./routes/creators'));
app.use('/api/opportunities',    require('./routes/opportunities'));
app.use('/api/applications',     require('./routes/applications'));
app.use('/api/follows',          require('./routes/follows'));
app.use('/api/messages',         require('./routes/messages'));
app.use('/api/notifications',    require('./routes/notifications'));

// Admin routes
app.use('/api/admin/auth',      authLimiter, require('./routes/admin/auth'));
app.use('/api/admin/queue',     require('./routes/admin/queue'));
app.use('/api/admin/content',   require('./routes/admin/content'));
app.use('/api/admin/users',     require('./routes/admin/users'));
app.use('/api/admin/analytics', require('./routes/admin/analytics'));
app.use('/api/admin/audit',     require('./routes/admin/audit'));
app.use('/api/admin/settings',  require('./routes/admin/settings'));

// 404
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

module.exports = app;
