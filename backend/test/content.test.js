'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const { readEnv } = require('../src/config/env');
const setup = require('../src/db/setup');

let app;

beforeAll(async () => {
  await setup();
  app = createApp(readEnv());
}, 30000);

describe('Health and content endpoints', () => {
  it('GET /healthz returns ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET / returns API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('PLXYGROUND API');
  });

  it('GET /api/content responds', async () => {
    const res = await request(app).get('/api/content');
    expect([200, 401, 403]).toContain(res.status);
  });

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
