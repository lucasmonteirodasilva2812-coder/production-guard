import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db, { hashPassword } from '../db';

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

router.get('/', requireAdmin, (_req, res) => {
  const users = db.prepare(
    'SELECT id, username, name, role, is_blocked, created_at FROM users ORDER BY created_at'
  ).all();
  res.json(users.map((u: any) => ({
    id: u.id, username: u.username, name: u.name,
    role: u.role, isBlocked: Boolean(u.is_blocked), createdAt: u.created_at,
  })));
});

router.post('/', requireAdmin, (req, res) => {
  const { username, password, name, role = 'operador' } = req.body as {
    username: string; password: string; name: string; role?: string;
  };
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Campos obrigatórios: username, password, name' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Usuário já existe' });

  const id = uuid();
  db.prepare('INSERT INTO users (id, username, password, name, role, is_blocked, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)')
    .run(id, username, hashPassword(password), name, role, new Date().toISOString());

  res.status(201).json({ id, username, name, role, isBlocked: false });
});

router.patch('/:id', requireAdmin, (req, res) => {
  const { isBlocked, password, name, role } = req.body as any;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (isBlocked !== undefined) {
    db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(isBlocked ? 1 : 0, req.params.id);
  }
  if (password) db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(password), req.params.id);
  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.params.id);
  if (role) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);

  const updated = db.prepare('SELECT id, username, name, role, is_blocked FROM users WHERE id = ?').get(req.params.id) as any;
  res.json({
    id: updated.id, username: updated.username, name: updated.name,
    role: updated.role, isBlocked: Boolean(updated.is_blocked),
  });
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
