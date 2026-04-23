#!/usr/bin/env node
import { randomBytes, createHash } from 'crypto';

const appName = process.argv[2];

if (!appName) {
  console.error('Usage: node scripts/generate-api-key.mjs "My App Name"');
  process.exit(1);
}

const rawKey = randomBytes(32).toString('hex');
const keyHash = createHash('sha256').update(rawKey).digest('hex');

console.log('\n--- API Key for:', appName, '---\n');
console.log('Raw key (store this in your connected app as the Bearer token):');
console.log(' ', rawKey);
console.log('');
console.log('SQL to insert into Supabase (run in the SQL editor):');
console.log(`
  INSERT INTO apps (name, api_key_hash)
  VALUES ('${appName.replace(/'/g, "''")}', '${keyHash}');
`);
console.log('The raw key is shown once. Store it somewhere safe.\n');
