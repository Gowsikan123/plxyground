'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');
const { setupDatabase } = require('./db/setup');
const { globalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const businessAuthRoutes = require('./routes/businessAuth');
const contentRoutes = require('./routes/content');
const creatorsRoutes = require('./routes/creators');
const opportunitiesRoutes = require('./routes/opportunities');
const adminAuthRoutes = require('./routes/admin/auth');
const adminQueueRoutes = require('./routes/admin/queue');
const adminContentRoutes = require('./routes/admin/content');
const adminUsersRoutes = require('./routes/admin/users');
const adminAnalyticsRoutes = require('./routes/admin/analytics');
const adminAuditRoutes = require('./routes/admin/audit');

setupDatabase();

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(globalLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/business-auth', businessAuthRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/creators', creatorsRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/queue', adminQueueRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/audit', adminAuditRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(config.port, () => {
  logger.info(`PLXYGROUND API running on port ${config.port}`);
});
