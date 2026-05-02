'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const setup = require('../src/db/setup');

let app;

beforeAll(async () => {
  await setup();
  app = createApp();
}, 30000);

describe('Health checks', () => {
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

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist-xyz');
    expect(res.status).toBe(404);
  });
});
