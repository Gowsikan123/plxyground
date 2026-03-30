const request = require('supertest');
const { createApp } = require('../src/app');
const { readEnv } = require('../src/config/env');
const db = require('../src/db/setup');

const app = createApp(readEnv());

describe('Auth and user data controls', () => {
  let token;
  let refreshToken;
  let createdId;

  it('signs up a user', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'TestUser',
      email: 'testuser@plxyground.local',
      password: 'Password123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    token = res.body.token;
    refreshToken = res.body.refreshToken;
    createdId = res.body.user.id;
  });

  it('gets user data export', async () => {
    const res = await request(app).get('/api/auth/me/export').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.content).toBeDefined();
  });

  it('refreshes token', async () => {
    const res = await request(app).post('/api/auth/refresh-token').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('requests 2FA and verifies', async () => {
    const r1 = await request(app).post('/api/auth/2fa/request').set('Authorization', `Bearer ${token}`);
    expect(r1.status).toBe(200);

    const record = db.prepare('SELECT code FROM two_factor_codes WHERE creator_id = ? ORDER BY created_at DESC LIMIT 1').get(createdId);
    expect(record).toBeDefined();

    const r2 = await request(app).post('/api/auth/2fa/verify').set('Authorization', `Bearer ${token}`).send({ code: record.code });
    expect(r2.status).toBe(200);
  });

  it('deletes user account', async () => {
    const res = await request(app).delete('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deletion/i);
  });
});
