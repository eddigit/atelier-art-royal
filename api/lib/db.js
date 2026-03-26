import pg from 'pg';
const { Pool } = pg;

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 8000,
  max: 3,
};

// Enable SSL for cloud-hosted PostgreSQL (Neon, Supabase, etc.)
if (process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('sslmode') ||
  process.env.DATABASE_URL.includes('.neon.tech') ||
  process.env.DATABASE_URL.includes('.supabase.') ||
  process.env.NODE_ENV === 'production'
)) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

/**
 * Execute a parameterized query against the database.
 * @param {string} text - SQL query string with $1, $2... placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text, duration, rows: result.rowCount });
  }
  return result;
}

export { pool, query };
