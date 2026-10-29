'use strict';
/**
 * Smoke tests — verify the API boots and core endpoints respond correctly.
 * Needs a migrated Postgres database: DATABASE_URL, JWT_SECRET and CORS_ORIGIN must be set.
 */
const request = require('supertest');
const app = require('../app');

describe('Smoke Tests', () => {
  afterAll(() => require('../db/client').end());

  test('GET /healthz → 200 { status: ok }', async () => {
    const res = await request(app).get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/creators → 200 with data array', async () => {
    const res = await request(app).get('/api/creators');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.creators)).toBe(true);
  });

  test('GET /api/content → 200 with data array', async () => {
    const res = await request(app).get('/api/content');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.posts)).toBe(true);
  });

  test('GET /api/opportunities → 200 with data array', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.opportunities)).toBe(true);
  });

  test('GET /api/auth/me without token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/admin/analytics without token → 401', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/signup with invalid email → 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'not-an-email', password: 'Password1', username: 'testuser', display_name: 'Test' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/login with wrong credentials → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });
});
