'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./logger');
const { globalLimiter } = require('./middleware/rateLimiter');

const authRoutes         = require('./routes/auth');
const businessAuthRoutes = require('./routes/businessAuth');
const contentRoutes      = require('./routes/content');
const creatorsRoutes     = require('./routes/creators');
const oppsRoutes         = require('./routes/opportunities');

const adminAuthRoutes      = require('./routes/admin/auth');
const adminQueueRoutes     = require('./routes/admin/queue');
const adminUsersRoutes     = require('./routes/admin/users');
const adminContentRoutes   = require('./routes/admin/content');
const adminAnalyticsRoutes = require('./routes/admin/analytics');
const adminAuditRoutes     = require('./routes/admin/audit');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use(globalLimiter);

// Health check — no auth, no rate limit
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'plxyground-api', ts: new Date().toISOString() });
});

// API routes
app.use('/api/auth',        authRoutes);
app.use('/api/business',    businessAuthRoutes);
app.use('/api/content',     contentRoutes);
app.use('/api/creators',    creatorsRoutes);
app.use('/api/opportunities', oppsRoutes);

// Admin routes
app.use('/api/admin/auth',      adminAuthRoutes);
app.use('/api/admin/queue',     adminQueueRoutes);
app.use('/api/admin/users',     adminUsersRoutes);
app.use('/api/admin/content',   adminContentRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/audit',     adminAuditRoutes);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
