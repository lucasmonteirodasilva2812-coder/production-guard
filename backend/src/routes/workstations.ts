
import { Router } from 'express';
import { pool } from '../pg.js';
import { broadcast, getConnectedClients } from '../sse.js';

const router = Router();

// Listar todas as bancadas
router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM workstations ORDER BY name');
  res.json(result.rows.map(mapWS));
});

// Criar ou reutilizar bancada pelo nome
router.post('/', async (req, res) => {
  const { name } = req.body as { name: string };
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório' });

  const existingRes = await pool.query('SELECT * FROM workstations WHERE name = $1', [name.trim()]);
  const existing = existingRes.rows[0];
  if (existing) return res.json(mapWS(existing));

  const insertRes = await pool.query('INSERT INTO workstations (name, printer_ip, printer_port, is_online) VALUES ($1, $2, $3, 0) RETURNING *', [name.trim(), '', 9100]);
  const row = insertRes.rows[0];
  broadcast('workstations:updated', {});
  res.status(201).json(mapWS(row));
});

// Atualizar status (online/offline manual pelo admin)
router.patch('/:id', async (req, res) => {
  const { isOnline } = req.body as { isOnline?: boolean };
  if (isOnline !== undefined) {
    await pool.query('UPDATE workstations SET is_online = $1 WHERE id = $2', [isOnline ? 1 : 0, req.params.id]);
    broadcast('workstations:updated', {});
  }
  const rowRes = await pool.query('SELECT * FROM workstations WHERE id = $1', [req.params.id]);
  res.json(mapWS(rowRes.rows[0]));
});

// Usuários ativos em uma bancada (SSE clients)
router.get('/:id/active-users', (req, res) => {
  const wsId = Number(req.params.id);
  const users = getConnectedClients()
    .filter(c => c.workstationId === wsId)
    .map(c => c.userName);
  res.json(users);
});

// Remover bancada
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM workstations WHERE id = $1', [req.params.id]);
  broadcast('workstations:updated', {});
  res.json({ ok: true });
});

function mapWS(row: any) {
  return {
    id: row.id,
    name: row.name,
    isOnline: Boolean(row.is_online),
  };
}

export default router;
