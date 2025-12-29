require('dotenv').config();
const knex = require('./knex');

knex.migrate
  .latest()
  .then(() => {
    console.log('Migrations complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error', error);
    process.exit(1);
  });
