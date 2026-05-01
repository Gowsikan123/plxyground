const db = require('./setup');

db.ready
  .then(() => {
    console.log('Database schema and demo data are ready.');
    return db.pool.end();
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
