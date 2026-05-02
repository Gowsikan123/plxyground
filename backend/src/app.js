'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: '*', credentials: false }));
  app.use(express.json({ limit: '10mb' }));

  // Health
  app.get('/healthz', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  );
  app.get('/', (_req, res) =>
    res.json({ name: 'PLXYGROUND API', version: '1.0.0' })
  );

  // Creator auth
  app.use('/api/auth', require('./routes/auth'));

  // Business auth + profile  (/business/content BEFORE /business)
  app.use('/api/business/auth',    require('./routes/businessAuth'));
  app.use('/api/business/content', require('./routes/businessContent'));
  app.use('/api/business',         require('./routes/business'));

  // Content, creators, opportunities
  app.use('/api/content',       require('./routes/content'));
  app.use('/api/creators',      require('./routes/creators'));
  app.use('/api/opportunities', require('./routes/opportunities'));

  // Admin routes
  app.use('/api/admin/auth',          require('./routes/admin/adminAuth'));
  app.use('/api/admin/queue',         require('./routes/admin/adminQueue'));
  app.use('/api/admin/users',         require('./routes/admin/adminUsers'));
  app.use('/api/admin/analytics',     require('./routes/admin/adminAnalytics'));
  app.use('/api/admin/audit',         require('./routes/admin/adminAudit'));
  app.use('/api/admin/alerts',        require('./routes/admin/adminAlerts'));
  app.use('/api/admin/content',       require('./routes/admin/adminContent'));
  app.use('/api/admin/opportunities', require('./routes/admin/adminOpportunities'));

  // 404
  app.use((_req, res) =>
    res.status(404).json({ success: false, error: 'Route not found' })
  );

  // Global error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
