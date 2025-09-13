#!/usr/bin/env node
import { createClient } from '@libsql/client';
const dbUrl = 'file:./mastra-memory.db';
const client = createClient({ url: dbUrl });

async function run() {
  console.log('Initializing minimal mastra tables in', dbUrl);
  // Create threads table with minimal columns expected by LibSQLStore.saveThread
  await client.execute(`
    CREATE TABLE IF NOT EXISTS mastra_threads (
      id TEXT PRIMARY KEY,
      resourceId TEXT,
      title TEXT,
      messages TEXT,
      metadata TEXT,
      createdAt TEXT
    );
  `);

  // Ensure messages column exists (some schema versions store messages elsewhere)
  try {
    const info = await client.execute({ sql: `PRAGMA table_info(mastra_threads)` });
    const cols = (info.rows || []).map(r => r.name);
    if (!cols.includes('messages')) {
      console.log('Adding missing column `messages` to mastra_threads');
      await client.execute(`ALTER TABLE mastra_threads ADD COLUMN messages TEXT;`);
    }
  } catch (e) {
    console.warn('Could not inspect/alter mastra_threads:', e?.message ?? e);
  }

  // Ensure createdAt is nullable (some versions expect createdAt provided; make it permissive)
  try {
    const info = await client.execute({ sql: `PRAGMA table_info(mastra_threads)` });
    const rows = info.rows || [];
    const createdAtCol = rows.find(r => r.name === 'createdAt');
    if (createdAtCol && createdAtCol.notnull === 1) {
      console.log('Migrating mastra_threads to make createdAt nullable');
      await client.execute(`CREATE TABLE IF NOT EXISTS mastra_threads_new (
        id TEXT PRIMARY KEY,
        resourceId TEXT,
        title TEXT,
        metadata TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        messages TEXT
      );`);
      // Copy data (map existing columns to new layout when possible)
      await client.execute(`INSERT INTO mastra_threads_new (id, resourceId, title, metadata, createdAt, updatedAt, messages)
        SELECT id, resourceId, title, metadata, createdAt, updatedAt, messages FROM mastra_threads;`);
      await client.execute(`DROP TABLE mastra_threads;`);
      await client.execute(`ALTER TABLE mastra_threads_new RENAME TO mastra_threads;`);
      console.log('Migration complete');
    }
  } catch (e) {
    console.warn('Could not migrate mastra_threads:', e?.message ?? e);
  }

  // Create messages table (minimal)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS mastra_messages (
      id TEXT PRIMARY KEY,
      threadId TEXT,
      role TEXT,
      content TEXT,
      metadata TEXT,
      createdAt TEXT
    );
  `);

  // Create resources table (minimal)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS mastra_resources (
      id TEXT PRIMARY KEY,
      name TEXT,
      metadata TEXT,
      createdAt TEXT
    );
  `);

  console.log('Done.');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
