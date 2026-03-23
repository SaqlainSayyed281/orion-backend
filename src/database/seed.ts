import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runSeeds = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _seeds (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const seedsDir = path.join(__dirname, 'seeds');
  const files = fs
    .readdirSync(seedsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows } = await pool.query('SELECT filename FROM _seeds');
  const executed = new Set(rows.map((r: { filename: string }) => r.filename));

  const pending = files.filter((f) => !executed.has(f));

  if (pending.length === 0) {
    console.log('✅ No pending seeds');
    await pool.end();
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf-8');
    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('INSERT INTO _seeds (filename) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      console.log(`✅ Seeded: ${file}`);
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error(`❌ Failed on seed: ${file}`, err);
      process.exit(1);
    }
  }

  await pool.end();
  console.log('🌱 All seeds complete');
};

runSeeds();
