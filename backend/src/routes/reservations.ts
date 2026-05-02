import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC').all();
  res.json(rows.map(mapReservation));
});

router.post('/', (req, res) => {
  const { partNumberId, workstationId, quantity } = req.body as {
    partNumberId: string;
    workstationId: number;
    quantity: number;
  };

  const pn = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(partNumberId) as any;
  if (!pn) return res.status(404).json({ error: 'Part number não encontrado' });

  const id = uuid();
  db.prepare(`
    INSERT INTO reservations (id, part_number_id, workstation_id, quantity, status, created_at)
    VALUES (?, ?, ?, ?, 'pendente', ?)
  `).run(id, partNumberId, workstationId, quantity, new Date().toISOString());

  if (pn.status === 'pendente') {
    db.prepare("UPDATE part_numbers SET status = 'em_processo' WHERE id = ?").run(partNumberId);
  }

  const row = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
  res.status(201).json(mapReservation(row));
});

router.patch('/:id/confirm', (_req, res) => {
  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(_req.params.id) as any;
  if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });

  db.prepare("UPDATE reservations SET status = 'consumido' WHERE id = ?").run(_req.params.id);
  db.prepare('UPDATE part_numbers SET labeled_qty = labeled_qty + ? WHERE id = ?')
    .run(reservation.quantity, reservation.part_number_id);

  const pn = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(reservation.part_number_id) as any;
  if (pn && pn.labeled_qty >= pn.declared_qty) {
    db.prepare("UPDATE part_numbers SET status = 'concluido' WHERE id = ?").run(pn.id);
  }

  res.json({ ok: true });
});

router.patch('/:id/cancel', (_req, res) => {
  db.prepare("UPDATE reservations SET status = 'cancelado' WHERE id = ?").run(_req.params.id);
  res.json({ ok: true });
});

function mapReservation(row: any) {
  return {
    id: row.id,
    partNumberId: row.part_number_id,
    workstationId: row.workstation_id,
    quantity: row.quantity,
    status: row.status,
    createdAt: row.created_at,
  };
}

export default router;
