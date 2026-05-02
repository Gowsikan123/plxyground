/**
 * Smoke tests for /api/auth routes.
 * Run with: cd backend && npm test
 */
const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/signup', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', email: 'not-an-email', password: 'Password1', display_name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser2', email: 'test2@example.com', password: 'weak', display_name: 'Test2' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when credentials are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
