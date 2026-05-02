'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

function createApp(config) {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.nodeEnv === 'development' || config.nodeEnv === 'test') return cb(null, true);
      const allowed = Array.isArray(config.corsOrigins) ? config.corsOrigins : [config.corsOrigins];
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));

  const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
  app.use('/api/auth', authLimiter);
  app.use('/api/business/auth', authLimiter);
  app.use('/api/admin/auth', authLimiter);

  const contentCreateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    handler: (req, res) => res.status(429).json({ error: 'Too many requests.' }),
  });

  app.use('/api/content', (req, res, next) => {
    if (req.method === 'POST') return contentCreateLimiter(req, res, next);
    next();
  });

  const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
  app.use('/api/admin', adminLimiter);

  app.get('/healthz', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/', (req, res) => res.json({ name: 'PLXYGROUND API', version: '1.0.0' }));

  app.use('/api/auth', require('./routes/auth'));
  // NOTE: /api/business/content must be mounted BEFORE /api/business
  app.use('/api/business/content', require('./routes/businessContent'));
  app.use('/api/business', require('./routes/business'));
  app.use('/api/content', require('./routes/content'));
  app.use('/api/creators', require('./routes/creators'));
  app.use('/api/opportunities', require('./routes/opportunities'));
  app.use('/api/admin/auth', require('./routes/admin/adminAuth'));
  app.use('/api/admin/content', require('./routes/admin/adminContent'));
  app.use('/api/admin/opportunities', require('./routes/admin/adminOpportunities'));
  app.use('/api/admin/users', require('./routes/admin/adminUsers'));
  app.use('/api/admin/queue', require('./routes/admin/adminQueue'));
  app.use('/api/admin/audit', require('./routes/admin/adminAudit'));
  app.use('/api/admin/analytics', require('./routes/admin/adminAnalytics'));
  app.use('/api/admin/alerts', require('./routes/admin/adminAlerts'));

  app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
