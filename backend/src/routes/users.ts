import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../pg.js';

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

router.get('/', requireAdmin, async (_req, res) => {
  const result = await pool.query('SELECT id, username, name, role, is_blocked, created_at FROM users ORDER BY created_at');
  res.json(result.rows.map((u: any) => ({
    id: u.id, username: u.username, name: u.name,
    role: u.role, isBlocked: Boolean(u.is_blocked), createdAt: u.created_at,
  })));
});

router.post('/', requireAdmin, async (req, res) => {
  const { username, password, name, role = 'operador' } = req.body as {
    username: string; password: string; name: string; role?: string;
  };
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Campos obrigatórios: username, password, name' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Usuário já existe' });

  const id = uuid();
  await pool.query('INSERT INTO users (id, username, password, name, role, is_blocked, created_at) VALUES ($1, $2, $3, $4, $5, 0, $6)',
    [id, username, hashPassword(password), name, role, new Date().toISOString()]);

  res.status(201).json({ id, username, name, role, isBlocked: false });
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { isBlocked, password, name, role } = req.body as any;
  const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  const user = userRes.rows[0];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (isBlocked !== undefined) {
    await pool.query('UPDATE users SET is_blocked = $1 WHERE id = $2', [isBlocked ? 1 : 0, req.params.id]);
  }
  if (password) await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashPassword(password), req.params.id]);
  if (name) await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, req.params.id]);
  if (role) await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);

  const updatedRes = await pool.query('SELECT id, username, name, role, is_blocked FROM users WHERE id = $1', [req.params.id]);
  const updated = updatedRes.rows[0];
  res.json({
    id: updated.id, username: updated.username, name: updated.name,
    role: updated.role, isBlocked: Boolean(updated.is_blocked),
  });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [req.params.id]);
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

export default router;
