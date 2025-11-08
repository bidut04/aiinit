import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.oldlqofyhvropppcdsgn',
  password: 'RUw39yUhokTQQrpP',
  database: 'postgres',
});

try {
  await client.connect();
  console.log('✓ Connection successful on port 6543!');
  await client.end();
} catch (err) {
  console.error('Connection failed on port 6543:', err.message);
  
  // Try port 5432
  console.log('\nTrying port 5432...');
  const client2 = new Client({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.oldlqofyhvropppcdsgn',
    password: 'RUw39yUhokTQQrpP',
    database: 'postgres',
  });
  
  try {
    await client2.connect();
    console.log('✓ Connection successful on port 5432!');
    await client2.end();
  } catch (err2) {
    console.error('Connection failed on port 5432:', err2.message);
  }
}