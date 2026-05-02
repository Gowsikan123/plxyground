'use strict';
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const setup = require('./db/setup');
const { globalLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRouter = require('./routes/auth');
const businessAuthRouter = require('./routes/businessAuth');
const businessContentRouter = require('./routes/businessContent');
const contentRouter = require('./routes/content');
const creatorsRouter = require('./routes/creators');
const opportunitiesRouter = require('./routes/opportunities');
const adminAuthRouter = require('./routes/admin/auth');
const adminQueueRouter = require('./routes/admin/queue');
const adminContentRouter = require('./routes/admin/content');
const adminUsersRouter = require('./routes/admin/users');
const adminAnalyticsRouter = require('./routes/admin/analytics');
const adminAuditRouter = require('./routes/admin/audit');

// Init DB
setup();

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan(config.isDev ? 'dev' : 'combined'));
app.use(globalLimiter);

// Health check
app.get('/healthz', (req, res) => res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.json({ name: 'PLXYGROUND API', version: '1.0.0' }));

// Creator auth + profile routes
app.use('/api/auth', authRouter);

// Business routes — IMPORTANT: /api/business/content BEFORE /api/business/auth to avoid prefix conflict
app.use('/api/business/content', businessContentRouter);
app.use('/api/business/auth', businessAuthRouter);

// Content, creators, opportunities
app.use('/api/content', contentRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/opportunities', opportunitiesRouter);

// Admin routes
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/queue', adminQueueRouter);
app.use('/api/admin/content', adminContentRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/analytics', adminAnalyticsRouter);
app.use('/api/admin/alerts', adminAnalyticsRouter);
app.use('/api/admin/audit', adminAuditRouter);

// 404 fallback
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`[server] PLXYGROUND API running on port ${config.port} (${config.nodeEnv})`);
});

module.exports = app;
