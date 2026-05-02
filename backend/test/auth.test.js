'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const setup = require('../src/db/setup');

let app;
const uid = Date.now();
const email = `smoke.${uid}@plxyground.local`;
let token;

beforeAll(async () => {
  await setup();
  app = createApp();
}, 30000);

describe('Creator auth', () => {
  it('signs up a new creator', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: `smokeuser${uid}`,
      display_name: 'Smoke User',
      email,
      password: 'Password123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('rejects duplicate email signup with 409', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: `smokeuser${uid}b`,
      display_name: 'Smoke User 2',
      email,
      password: 'Password123!',
    });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
