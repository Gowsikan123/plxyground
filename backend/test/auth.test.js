'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const { readEnv } = require('../src/config/env');
const setup = require('../src/db/setup');

let app;
const uniqueId = Date.now();
const email = `testuser.${uniqueId}@plxyground.local`;

beforeAll(async () => {
  await setup();
  app = createApp(readEnv());
}, 30000);

describe('Auth — signup / login / me', () => {
  let token;

  it('signs up a creator', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: `testuser${uniqueId}`,
      display_name: 'Test User',
      email,
      password: 'Password123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('rejects duplicate email on second signup', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      username: `testuser${uniqueId}b`,
      display_name: 'Test User 2',
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

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
  });

  it('returns current user on GET /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('rejects /api/auth/me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
