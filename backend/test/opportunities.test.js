const request = require('supertest');
const { createApp } = require('../src/app');
const { readEnv } = require('../src/config/env');
const db = require('../src/db/setup');

const app = createApp(readEnv());

describe('Opportunity moderation flow', () => {
  let creatorToken;
  let businessToken;
  let adminToken;
  let opportunityId;
  let queueId;
  const uniqueId = Date.now();

  beforeAll(async () => {
    const creatorSignup = await request(app).post('/api/auth/signup').send({
      name: `Opp Creator ${uniqueId}`,
      email: `opp.creator.${uniqueId}@plxyground.local`,
      password: 'Password123!',
    });
    creatorToken = creatorSignup.body.token;

    const businessSignup = await request(app).post('/api/business/auth/signup').send({
      organizationName: `Opp Business ${uniqueId}`,
      email: `opp.business.${uniqueId}@plxyground.local`,
      password: 'Password123!',
    });
    businessToken = businessSignup.body.token;

    const adminLogin = await request(app).post('/api/admin/auth/login').send({
      email: 'admin@plxyground.local',
      password: 'Internet2026@',
    });
    adminToken = adminLogin.body.token;
  });

  it('creates new business opportunities in pending state', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        title: `Pending opportunity ${uniqueId}`,
        role_type: 'Sponsored campaign',
        body: 'Need creators for a product launch.',
        requirements: 'Sports audience',
        benefits: 'Paid campaign',
      });

    expect(res.status).toBe(201);
    expect(res.body.is_published).toBe(0);
    opportunityId = res.body.id;

    const queueItem = await db.prepare(
      `SELECT * FROM moderation_queue WHERE entity_id = ? AND type = 'opportunity' ORDER BY created_at DESC LIMIT 1`
    ).get(opportunityId);
    expect(queueItem).toBeDefined();
    expect(queueItem.status).toBe('pending');
    queueId = queueItem.id;
  });

  it('prevents businesses from self-publishing opportunities', async () => {
    const res = await request(app)
      .put(`/api/opportunities/${opportunityId}`)
      .set('Authorization', `Bearer ${businessToken}`)
      .send({
        title: `Edited pending opportunity ${uniqueId}`,
        is_published: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.is_published).toBe(0);

    const queueItem = await db.prepare('SELECT * FROM moderation_queue WHERE id = ?').get(queueId);
    expect(queueItem.status).toBe('pending');
  });

  it('allows admins to approve opportunities and creators to apply', async () => {
    const approve = await request(app)
      .post('/api/admin/queue/bulk-action')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve', ids: [queueId] });

    expect(approve.status).toBe(200);

    const opportunity = await db.prepare('SELECT * FROM opportunities WHERE id = ?').get(opportunityId);
    expect(opportunity.is_published).toBe(1);

    const apply = await request(app)
      .post(`/api/opportunities/${opportunityId}/apply`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ message: 'I would like to apply.' });

    expect(apply.status).toBe(201);
    expect(apply.body.applicationId).toBeDefined();
  });
});
