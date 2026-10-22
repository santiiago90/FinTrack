import pg from 'pg';
export const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'fintrack',
  user: process.env.DB_USER || 'fintrack',
  password: process.env.DB_PASSWORD,
});
