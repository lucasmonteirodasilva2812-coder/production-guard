import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db, { hashPassword } from '../db';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

  const hash = hashPassword(password);
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, hash) as any;

  if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  if (user.is_blocked) return res.status(403).json({ error: 'Usuário bloqueado. Contate o administrador.' });

  const token = uuid();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, user.id, new Date().toISOString(), expiresAt);

  // Purge expired sessions
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());

  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
});

router.post('/logout', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token) db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autenticado' });

  const session = db.prepare(`
    SELECT s.user_id, u.username, u.name, u.role, u.is_blocked
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > ?
  `).get(token, new Date().toISOString()) as any;

  if (!session) return res.status(401).json({ error: 'Sessão inválida ou expirada' });
  if (session.is_blocked) return res.status(403).json({ error: 'Usuário bloqueado' });

  res.json({ id: session.user_id, username: session.username, name: session.name, role: session.role });
});

export default router;
