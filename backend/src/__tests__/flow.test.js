'use strict';
/**
 * End-to-end API journey against a real, migrated Postgres database:
 * business posts an opportunity → creator applies → business accepts →
 * creator posts content → admin approves it → it becomes public.
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const sql = require('../db/client');

const run = Date.now();
const password = 'Password1';
let businessToken;
let creatorToken;
let adminToken;
let opportunityId;
let postId;

beforeAll(async () => {
  const adminEmail = `admin.${run}@test.local`;
  const hash = await bcrypt.hash('AdminPassword123', 4);
  await sql`INSERT INTO admin_users (email, password_hash) VALUES (${adminEmail}, ${hash})`;
  const res = await request(app).post('/api/admin/auth/login').send({ email: adminEmail, password: 'AdminPassword123' });
  adminToken = res.body.token || res.body.data?.token;
});

afterAll(() => sql.end());

test('business signs up', async () => {
  const res = await request(app).post('/api/business/auth/signup')
    .send({ email: `brand.${run}@test.local`, password, company_name: `Brand ${run}` });
  expect(res.status).toBe(201);
  businessToken = res.body.data.token;
});

test('creator signs up', async () => {
  const res = await request(app).post('/api/auth/signup')
    .send({ email: `creator.${run}@test.local`, password, username: `c${run}`.slice(0, 20), display_name: 'Test Creator', sport: 'Basketball' });
  expect(res.status).toBe(201);
  creatorToken = res.body.data.token;
});

test('business posts an opportunity', async () => {
  const res = await request(app).post('/api/opportunities')
    .set('Authorization', `Bearer ${businessToken}`)
    .send({ title: `Ambassador ${run}`, description: 'Promote our shoes', sport: 'Basketball' });
  expect(res.status).toBe(201);
  opportunityId = res.body.data.id;
});

test('opportunity is listed with its poster', async () => {
  const res = await request(app).get(`/api/opportunities?search=${encodeURIComponent(`Ambassador ${run}`)}`);
  expect(res.status).toBe(200);
  expect(res.body.data.total).toBe(1);
  expect(res.body.data.opportunities[0].poster.display_name).toBe(`Brand ${run}`);
});

test('creator applies once, second attempt is rejected', async () => {
  const first = await request(app).post('/api/applications')
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ opportunity_id: opportunityId, message: 'Pick me' });
  expect(first.status).toBe(201);

  const second = await request(app).post('/api/applications')
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ opportunity_id: opportunityId });
  expect(second.status).toBe(409);
});

test('business accepts the application', async () => {
  const list = await request(app).get(`/api/applications/opportunity/${opportunityId}`)
    .set('Authorization', `Bearer ${businessToken}`);
  expect(list.status).toBe(200);
  const res = await request(app).put(`/api/applications/${list.body.data[0].id}/status`)
    .set('Authorization', `Bearer ${businessToken}`)
    .send({ status: 'accepted' });
  expect(res.status).toBe(200);
  expect(res.body.data.status).toBe('accepted');
});

test('business sees its listing with application counts', async () => {
  const res = await request(app).get('/api/opportunities/mine').set('Authorization', `Bearer ${businessToken}`);
  expect(res.status).toBe(200);
  const listing = res.body.data.find((o) => o.id === opportunityId);
  expect(listing.application_count).toBe(1);
});

test('business updates its profile', async () => {
  const res = await request(app).put('/api/business/auth/me')
    .set('Authorization', `Bearer ${businessToken}`)
    .send({ industry: 'Footwear', bio: 'We make shoes' });
  expect(res.status).toBe(200);
  expect(res.body.data.industry).toBe('Footwear');
});

test('creator post goes through moderation before it is public', async () => {
  const created = await request(app).post('/api/content')
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ title: `Highlight reel ${run}` });
  expect(created.status).toBe(201);
  postId = created.body.data.id;

  expect((await request(app).get(`/api/content/${postId}`)).status).toBe(404);

  const queue = await request(app).get('/api/admin/queue').set('Authorization', `Bearer ${adminToken}`);
  expect(queue.status).toBe(200);
  const item = queue.body.data.find((i) => i.content_id === postId && i.type === 'creator');
  expect(item).toBeDefined();

  const approve = await request(app).patch(`/api/admin/queue/${item.id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'approved' });
  expect(approve.status).toBe(200);

  expect((await request(app).get(`/api/content/${postId}`)).status).toBe(200);
});

test('admin analytics returns KPIs and a 7-day series', async () => {
  const res = await request(app).get('/api/admin/analytics').set('Authorization', `Bearer ${adminToken}`);
  expect(res.status).toBe(200);
  expect(res.body.data.kpis.total_opps).toBeGreaterThanOrEqual(1);
  expect(res.body.data.content_last_7_days).toHaveLength(7);
});

test('brand was notified of the application and the creator of the decision', async () => {
  const brand = await request(app).get('/api/notifications').set('Authorization', `Bearer ${businessToken}`);
  expect(brand.body.data.some((n) => n.type === 'application_received')).toBe(true);
  const creator = await request(app).get('/api/notifications').set('Authorization', `Bearer ${creatorToken}`);
  expect(creator.body.data.some((n) => n.type === 'application_decided')).toBe(true);
  const counts = await request(app).get('/api/notifications/unread').set('Authorization', `Bearer ${creatorToken}`);
  expect(counts.body.data.notifications).toBeGreaterThanOrEqual(1);
});

test('creator and brand can message each other', async () => {
  const me = await request(app).get('/api/business/auth/me').set('Authorization', `Bearer ${businessToken}`);
  const thread = await request(app).post('/api/messages/threads')
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ recipient_type: 'business', recipient_id: me.body.data.id });
  expect(thread.status).toBe(201);
  const sent = await request(app).post(`/api/messages/threads/${thread.body.data.id}`)
    .set('Authorization', `Bearer ${creatorToken}`)
    .send({ body: 'Thanks for accepting me!' });
  expect(sent.status).toBe(201);

  const inbox = await request(app).get('/api/messages/threads').set('Authorization', `Bearer ${businessToken}`);
  const t = inbox.body.data.find((x) => x.id === thread.body.data.id);
  expect(t.last_message).toBe('Thanks for accepting me!');
  expect(t.unread_count).toBe(1);
});

test('uploads are validated and report when storage is not configured', async () => {
  const bad = await request(app).post('/api/uploads').set('Authorization', `Bearer ${creatorToken}`)
    .send({ data: 'abc', content_type: 'image/gif' });
  expect(bad.status).toBe(400);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const res = await request(app).post('/api/uploads').set('Authorization', `Bearer ${creatorToken}`)
      .send({ data: 'aGVsbG8=', content_type: 'image/jpeg' });
    expect(res.status).toBe(503);
  }
});

test('non-admins cannot reach admin routes', async () => {
  const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${creatorToken}`);
  expect(res.status).toBe(403);
});

describe('safety', () => {
  let brandId;
  let creatorId;

  beforeAll(async () => {
    brandId = (await request(app).get('/api/business/auth/me').set('Authorization', `Bearer ${businessToken}`)).body.data.id;
    creatorId = (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${creatorToken}`)).body.data.creator_id;
  });

  test('a report reaches the admin queue and can be dismissed', async () => {
    const report = await request(app).post('/api/safety/reports').set('Authorization', `Bearer ${businessToken}`)
      .send({ target_type: 'creator', target_id: creatorId, reason: 'spam', details: 'Test report' });
    expect(report.status).toBe(201);

    const list = await request(app).get('/api/admin/reports').set('Authorization', `Bearer ${adminToken}`);
    const found = list.body.data.find((r) => r.id === report.body.data.id);
    expect(found.target_label).toBe('Test Creator');
    expect(found.reporter_name).toBe(`Brand ${run}`);

    const done = await request(app).put(`/api/admin/reports/${found.id}`).set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'dismissed' });
    expect(done.status).toBe(200);
  });

  test('blocking stops messages both ways until unblocked', async () => {
    const block = await request(app).post('/api/safety/blocks').set('Authorization', `Bearer ${businessToken}`)
      .send({ blocked_type: 'creator', blocked_id: creatorId });
    expect(block.status).toBe(201);

    const open = await request(app).post('/api/messages/threads').set('Authorization', `Bearer ${creatorToken}`)
      .send({ recipient_type: 'business', recipient_id: brandId });
    expect(open.status).toBe(403);
    const inbox = await request(app).get('/api/messages/threads').set('Authorization', `Bearer ${creatorToken}`);
    expect(inbox.body.data).toHaveLength(0);

    const unblock = await request(app).delete(`/api/safety/blocks/creator/${creatorId}`).set('Authorization', `Bearer ${businessToken}`);
    expect(unblock.status).toBe(200);
    const again = await request(app).post('/api/messages/threads').set('Authorization', `Bearer ${creatorToken}`)
      .send({ recipient_type: 'business', recipient_id: brandId });
    expect(again.status).toBe(200);
  });

  test('deleting an account needs the password and removes it', async () => {
    const wrong = await request(app).post('/api/safety/delete-account').set('Authorization', `Bearer ${creatorToken}`)
      .send({ password: 'not-it' });
    expect(wrong.status).toBe(401);

    const ok = await request(app).post('/api/safety/delete-account').set('Authorization', `Bearer ${creatorToken}`)
      .send({ password });
    expect(ok.status).toBe(200);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${creatorToken}`);
    expect(me.status).toBe(401);
    const login = await request(app).post('/api/auth/login').send({ email: `creator.${run}@test.local`, password });
    expect(login.status).toBe(401);
    const threads = await sql`
      SELECT count(*)::int AS n FROM message_threads
      WHERE (participant_a_type = 'creator' AND participant_a_id = ${creatorId})
         OR (participant_b_type = 'creator' AND participant_b_id = ${creatorId})`;
    expect(threads[0].n).toBe(0);
  });
});
