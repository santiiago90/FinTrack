import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
try {
  await pool.query(await readFile(new URL('../../database/001-expenses.sql', import.meta.url), 'utf8'));
  console.log('Esquema de despesas preparado.');
} finally {
  await pool.end();
}
