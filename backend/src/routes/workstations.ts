import { Router } from 'express';
import db from '../db';
import { broadcast } from '../sse';

const router = Router();

// Listar todas as bancadas
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM workstations ORDER BY name').all();
  res.json(rows.map(mapWS));
});

// Criar ou reutilizar bancada pelo nome
router.post('/', (req, res) => {
  const { name } = req.body as { name: string };
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório' });

  const existing = db.prepare('SELECT * FROM workstations WHERE name = ?').get(name.trim()) as any;
  if (existing) return res.json(mapWS(existing));

  const result = db.prepare(
    'INSERT INTO workstations (name, printer_ip, printer_port, is_online) VALUES (?, \'\', 9100, 0)'
  ).run(name.trim());
  const row = db.prepare('SELECT * FROM workstations WHERE id = ?').get(result.lastInsertRowid);
  broadcast('workstations:updated', {});
  res.status(201).json(mapWS(row));
});

// Atualizar status (online/offline manual pelo admin)
router.patch('/:id', (req, res) => {
  const { isOnline } = req.body as { isOnline?: boolean };
  if (isOnline !== undefined) {
    db.prepare('UPDATE workstations SET is_online = ? WHERE id = ?').run(isOnline ? 1 : 0, req.params.id);
    broadcast('workstations:updated', {});
  }
  const row = db.prepare('SELECT * FROM workstations WHERE id = ?').get(req.params.id);
  res.json(mapWS(row));
});

// Remover bancada
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM workstations WHERE id = ?').run(req.params.id);
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
