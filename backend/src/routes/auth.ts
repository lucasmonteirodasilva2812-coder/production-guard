import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db, { hashPassword } from '../db';
import { pool } from '../pg';
const isPg = !!process.env.DATABASE_URL;

const router = Router();


router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  const hash = hashPassword(password);
  if (isPg) {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, hash]);
      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
      if (user.is_blocked) return res.status(403).json({ error: 'Usuário bloqueado. Contate o administrador.' });
      if (user.role !== 'admin') {
        await pool.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
      }
      const token = uuid();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await pool.query('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)', [token, user.id, new Date().toISOString(), expiresAt]);
      await pool.query('DELETE FROM sessions WHERE expires_at < $1', [new Date().toISOString()]);
      res.json({
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao autenticar (PostgreSQL)' });
    }
  } else {
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, hash) as any;
      if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });
      if (user.is_blocked) return res.status(403).json({ error: 'Usuário bloqueado. Contate o administrador.' });
      if (user.role !== 'admin') {
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      }
      const token = uuid();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      db.prepare('INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(token, user.id, new Date().toISOString(), expiresAt);
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
      res.json({
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao autenticar (SQLite)' });
    }
  }
});


router.post('/logout', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (isPg) {
    if (token) await pool.query('DELETE FROM sessions WHERE id = $1', [token]);
    res.json({ ok: true });
  } else {
    if (token) db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
    res.json({ ok: true });
  }
});


router.get('/me', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  if (isPg) {
    try {
      const { rows } = await pool.query(`
        SELECT s.user_id, u.username, u.name, u.role, u.is_blocked
        FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = $1 AND s.expires_at > $2
      `, [token, new Date().toISOString()]);
      const session = rows[0];
      if (!session) return res.status(401).json({ error: 'Sessão inválida ou expirada' });
      if (session.is_blocked) return res.status(403).json({ error: 'Usuário bloqueado' });
      res.json({ id: session.user_id, username: session.username, name: session.name, role: session.role });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao validar sessão (PostgreSQL)' });
    }
  } else {
    try {
      const session = db.prepare(`
        SELECT s.user_id, u.username, u.name, u.role, u.is_blocked
        FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > ?
      `).get(token, new Date().toISOString()) as any;
      if (!session) return res.status(401).json({ error: 'Sessão inválida ou expirada' });
      if (session.is_blocked) return res.status(403).json({ error: 'Usuário bloqueado' });
      res.json({ id: session.user_id, username: session.username, name: session.name, role: session.role });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao validar sessão (SQLite)' });
    }
  }
});

export default router;
