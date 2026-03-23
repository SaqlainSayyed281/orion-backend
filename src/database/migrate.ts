import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows } = await pool.query('SELECT filename FROM _migrations');
  const executed = new Set(rows.map((r: { filename: string }) => r.filename));

  const pending = files.filter((f) => !executed.has(f));

  if (pending.length === 0) {
    console.log('✅ No pending migrations');
    await pool.end();
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [
        file,
      ]);
      await pool.query('COMMIT');
      console.log(`✅ Migrated: ${file}`);
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error(`❌ Failed on migration: ${file}`, err);
      process.exit(1);
    }
  }

  await pool.end();
  console.log('🎯 All migrations complete');
};

runMigrations();
