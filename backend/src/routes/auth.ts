import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../pg.js';

const router = Router();


router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  const hash = hashPassword(password);
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
    console.error('[ERRO LOGIN]', err);
    res.status(500).json({ error: 'Erro ao autenticar (PostgreSQL)' });
  }
});

router.get('/me', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
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
});

export default router;
