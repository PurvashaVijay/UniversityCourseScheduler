const { Client } = require('pg');

// Connection details
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Postgre123',
  port: 5432,
});

// Connect to the database
client.connect()
  .then(() => {
    console.log('✓ Successfully connected to PostgreSQL database!');
    return client.end();
  })
  .catch(err => {
    console.error('✗ Database connection error:', err);
  });