// Arquivo migrado para PostgreSQL/Supabase
// Veja backend/src/pg.ts para conexão

// TODO: Reimplementar helpers e seeds usando pool do pg
// TODO: Adaptar queries para PostgreSQL

export function hashPassword(pass: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(pass).digest('hex');
}
