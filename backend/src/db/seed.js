const bcrypt = require('bcrypt');
const db = require('./setup');

async function seed() {
  const adminExists = db.prepare('SELECT id FROM admins WHERE email = ?').get('admin@plxyground.local');
  if (adminExists) {
    console.log('Already seeded — skipping.');
    return;
  }

  console.log('Seeding database...');

  const adminHash = await bcrypt.hash('Internet2026@', 10);
  db.prepare(`INSERT INTO admins (email, password_hash) VALUES (?, ?)`).run('admin@plxyground.local', adminHash);

  const creatorHash = await bcrypt.hash('Password1!', 10);

  const sarah = db.prepare(`INSERT INTO creators (name, role, bio, location, profile_slug) VALUES (?, ?, ?, ?, ?)`).run(
    'Sarah Johnson', 'CREATOR', 'Sports content creator and athlete.', 'London, UK', 'sarahjohnson'
  );
  db.prepare(`INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)`).run(sarah.lastInsertRowid, 'sarahjohnson@plxyground.local', creatorHash);

  const mike = db.prepare(`INSERT INTO creators (name, role, bio, location, profile_slug) VALUES (?, ?, ?, ?, ?)`).run(
    'Mike Thompson', 'CREATOR', 'Basketball coach and writer.', 'Manchester, UK', 'mikethompson'
  );
  db.prepare(`INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)`).run(mike.lastInsertRowid, 'mikethompson@plxyground.local', creatorHash);

  const alex = db.prepare(`INSERT INTO creators (name, role, bio, location, profile_slug) VALUES (?, ?, ?, ?, ?)`).run(
    'Alex Rivera', 'CREATOR', 'Fitness influencer and personal trainer.', 'Birmingham, UK', 'alexrivera'
  );
  db.prepare(`INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)`).run(alex.lastInsertRowid, 'alexrivera@plxyground.local', creatorHash);

  const nike = db.prepare(`INSERT INTO creators (name, role, bio, location, profile_slug) VALUES (?, ?, ?, ?, ?)`).run(
    'Nike', 'BUSINESS', 'Just Do It.', 'Global', 'nike'
  );
  db.prepare(`INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)`).run(nike.lastInsertRowid, 'nike@plxyground.local', creatorHash);

  const adidas = db.prepare(`INSERT INTO creators (name, role, bio, location, profile_slug) VALUES (?, ?, ?, ?, ?)`).run(
    'Adidas', 'BUSINESS', 'Impossible is Nothing.', 'Global', 'adidas'
  );
  db.prepare(`INSERT INTO creator_accounts (creator_id, email, password_hash) VALUES (?, ?, ?)`).run(adidas.lastInsertRowid, 'adidas@plxyground.local', creatorHash);

  const mediaUrls = [
    'https://images.unsplash.com/photo-1546519638405-a9f5a95a5b64?w=800',
    'https://images.unsplash.com/photo-1495841674378-c3c9e6f44c00?w=800',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=800',
    'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  ];

  const posts = [
    { creator_id: sarah.lastInsertRowid, content_type: 'article', title: 'My Morning Training Routine', body: 'Every morning I start with a 5km run followed by strength training. The key is consistency — you have to show up even when you do not feel like it. After three years of this routine, I have seen incredible results both mentally and physically.', media_url: mediaUrls[0], is_published: 1 },
    { creator_id: sarah.lastInsertRowid, content_type: 'image_story', title: 'Track Day Highlights', body: 'What an incredible session on the track today. Personal bests across the board. The team is firing on all cylinders and we are building something special here.', media_url: mediaUrls[1], is_published: 1 },
    { creator_id: mike.lastInsertRowid, content_type: 'article', title: 'Breaking Down the Pick and Roll', body: 'The pick and roll is the most versatile play in basketball. Understanding how to execute it as a ball handler and how to defend it as a team is essential at every level of the game. Let me walk you through the fundamentals.', media_url: mediaUrls[2], is_published: 1 },
    { creator_id: mike.lastInsertRowid, content_type: 'video_embed', title: 'Coaching Session Highlights', body: 'Yesterday we ran our first full team scrimmage of the season. The progress these players have made in six weeks is remarkable. Full breakdown in this weeks session video.', media_url: mediaUrls[3], is_published: 0 },
    { creator_id: alex.lastInsertRowid, content_type: 'article', title: '30-Day Strength Challenge Results', body: 'Thirty days ago I started a strict strength programme with zero equipment — just bodyweight movements and progressive overload. Here are the results and what I learned about consistency, recovery, and mental resilience.', media_url: mediaUrls[4], is_published: 1 },
    { creator_id: alex.lastInsertRowid, content_type: 'image_story', title: 'Gym Setup Tour', body: 'Finally finished setting up the home gym. Built it from scratch over six months. Every piece of equipment was chosen with intention. This is where the work happens.', media_url: mediaUrls[5], is_published: 0 },
    { creator_id: sarah.lastInsertRowid, content_type: 'article', title: 'Nutrition for Athletes: What I Actually Eat', body: 'Forget the complicated meal plans you see online. As a full-time athlete on a budget, my approach to nutrition is simple, repeatable, and effective. High protein, quality carbohydrates around training, and fats from whole food sources.', media_url: mediaUrls[6], is_published: 1 },
    { creator_id: mike.lastInsertRowid, content_type: 'article', title: 'Why Defence Wins Championships', body: 'Everyone wants to talk about scoring. But the teams that win consistently — at every level — are built on defensive principles. Rotations, communication, effort on the weak side. Let me show you what elite defence actually looks like.', media_url: mediaUrls[0], is_published: 0 },
    { creator_id: alex.lastInsertRowid, content_type: 'video_embed', title: 'Skill Progression Drills for All Levels', body: 'The drills I use with pro-level trainees can be scaled for beginners and elite athletes alike. In this post, I share my top three drills for agility, coordination, and decision-making.', media_url: mediaUrls[1], is_published: 1 },
    { creator_id: sarah.lastInsertRowid, content_type: 'image_story', title: 'Recovery Day Ritual', body: 'Not every day is high intensity. Recovery is when your body adapts. Here are my favorite stretches, nutrition picks, and mindset practices for rest days.', media_url: mediaUrls[2], is_published: 0 },
  ];

  const insertContent = db.prepare(`
    INSERT INTO content (creator_id, content_type, title, body, media_url, is_published, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const post of posts) {
    insertContent.run(
      post.creator_id, post.content_type, post.title, post.body,
      post.media_url, post.is_published,
      post.is_published ? new Date().toISOString() : null
    );
  }

  db.prepare(`
    INSERT INTO moderation_queue (type, status, title_or_name, submitted_by, entity_id)
    SELECT 'content', 'pending', title, (SELECT email FROM creator_accounts WHERE creator_id = content.creator_id), id
    FROM content WHERE is_published = 0
  `).run();

  console.log('Seed complete!');
}

seed().catch(console.error);