import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db';
import { pool } from '../pg';
const isPg = !!process.env.DATABASE_URL;

const router = Router();

router.get('/', async (_req, res) => {
  let rows;
  if (isPg) {
    const result = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
    rows = result.rows;
  } else {
    rows = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC').all();
  }
  res.json(rows.map(mapReservation));
});

router.post('/', async (req, res) => {
  const { partNumberId, workstationId, quantity } = req.body as {
    partNumberId: string;
    workstationId: number;
    quantity: number;
  };

  let pn;
  if (isPg) {
    const pnRes = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [partNumberId]);
    pn = pnRes.rows[0];
  } else {
    pn = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(partNumberId) as any;
  }
  if (!pn) return res.status(404).json({ error: 'Part number não encontrado' });

  const id = uuid();
  const now = new Date().toISOString();
  if (isPg) {
    await pool.query(`
      INSERT INTO reservations (id, part_number_id, workstation_id, quantity, status, created_at)
      VALUES ($1, $2, $3, $4, 'pendente', $5)
    `, [id, partNumberId, workstationId, quantity, now]);
    if (pn.status === 'pendente') {
      await pool.query("UPDATE part_numbers SET status = 'em_processo' WHERE id = $1", [partNumberId]);
    }
    const rowRes = await pool.query('SELECT * FROM reservations WHERE id = $1', [id]);
    res.status(201).json(mapReservation(rowRes.rows[0]));
  } else {
    db.prepare(`
      INSERT INTO reservations (id, part_number_id, workstation_id, quantity, status, created_at)
      VALUES (?, ?, ?, ?, 'pendente', ?)
    `).run(id, partNumberId, workstationId, quantity, now);
    if (pn.status === 'pendente') {
      db.prepare("UPDATE part_numbers SET status = 'em_processo' WHERE id = ?").run(partNumberId);
    }
    const row = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    res.status(201).json(mapReservation(row));
  }
});

router.patch('/:id/confirm', async (_req, res) => {
  let reservation;
  if (isPg) {
    const resvRes = await pool.query('SELECT * FROM reservations WHERE id = $1', [_req.params.id]);
    reservation = resvRes.rows[0];
  } else {
    reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(_req.params.id) as any;
  }
  if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });

  if (isPg) {
    await pool.query("UPDATE reservations SET status = 'consumido' WHERE id = $1", [_req.params.id]);
    await pool.query('UPDATE part_numbers SET labeled_qty = labeled_qty + $1 WHERE id = $2', [reservation.quantity, reservation.part_number_id]);
    const pnRes = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [reservation.part_number_id]);
    const pn = pnRes.rows[0];
    if (pn && pn.labeled_qty >= pn.declared_qty) {
      await pool.query("UPDATE part_numbers SET status = 'concluido' WHERE id = $1", [pn.id]);
    }
    res.json({ ok: true });
  } else {
    db.prepare("UPDATE reservations SET status = 'consumido' WHERE id = ?").run(_req.params.id);
    db.prepare('UPDATE part_numbers SET labeled_qty = labeled_qty + ? WHERE id = ?')
      .run(reservation.quantity, reservation.part_number_id);
    const pn = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(reservation.part_number_id) as any;
    if (pn && pn.labeled_qty >= pn.declared_qty) {
      db.prepare("UPDATE part_numbers SET status = 'concluido' WHERE id = ?").run(pn.id);
    }
    res.json({ ok: true });
  }
});

router.patch('/:id/cancel', async (_req, res) => {
  if (isPg) {
    await pool.query("UPDATE reservations SET status = 'cancelado' WHERE id = $1", [_req.params.id]);
    res.json({ ok: true });
  } else {
    db.prepare("UPDATE reservations SET status = 'cancelado' WHERE id = ?").run(_req.params.id);
    res.json({ ok: true });
  }
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
