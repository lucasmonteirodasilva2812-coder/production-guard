db.pragma('foreign_keys = ON');
db.exec(`
db.prepare('UPDATE workstations SET is_online = 0').run();
db.prepare('UPDATE users SET is_blocked = 0 WHERE username = ? AND role = ?').run('admin', 'admin');
// Arquivo migrado para PostgreSQL/Supabase
// Veja backend/src/pg.ts para conexão

// TODO: Reimplementar helpers e seeds usando pool do pg
// TODO: Adaptar queries para PostgreSQL

export function hashPassword(pass: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(pass).digest('hex');
}
