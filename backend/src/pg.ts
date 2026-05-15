// Nova conexão PostgreSQL para Supabase
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || '';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Necessário para Supabase
});

// Exemplo de uso:
// const result = await pool.query('SELECT NOW()');
// console.log(result.rows);
