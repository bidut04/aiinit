const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.oldlqofyhvropppcdsgn',
  password: 'RUw39yUhokTQQrpP',
  database: 'postgres',
});

client.connect((err) => {
  if (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
  console.log('✓ Connection successful!');
  client.end();
});