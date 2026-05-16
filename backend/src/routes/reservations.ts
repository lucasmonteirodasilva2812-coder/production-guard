import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../pg.js';

const router = Router();

router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { partNumberId, workstationId, quantity } = req.body as {
    partNumberId: string;
    workstationId: number;
    quantity: number;
  };

  const pnRes = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [partNumberId]);
  const pn = pnRes.rows[0];
  if (!pn) return res.status(404).json({ error: 'Part number não encontrado' });

  const id = uuid();
  const now = new Date().toISOString();
  await pool.query(`
    INSERT INTO reservations (id, part_number_id, workstation_id, quantity, status, created_at)
    VALUES ($1, $2, $3, $4, 'pendente', $5)
  `, [id, partNumberId, workstationId, quantity, now]);
  if (pn.status === 'pendente') {
    await pool.query("UPDATE part_numbers SET status = 'em_processo' WHERE id = $1", [partNumberId]);
  }
  const rowRes = await pool.query('SELECT * FROM reservations WHERE id = $1', [id]);
  res.status(201).json(rowRes.rows[0]);
});

router.patch('/:id/confirm', async (req, res) => {
  const resvRes = await pool.query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
  const reservation = resvRes.rows[0];
  if (!reservation) return res.status(404).json({ error: 'Reserva não encontrada' });

  await pool.query("UPDATE reservations SET status = 'consumido' WHERE id = $1", [req.params.id]);
  await pool.query('UPDATE part_numbers SET labeled_qty = labeled_qty + $1 WHERE id = $2', [reservation.quantity, reservation.part_number_id]);
  const pnRes = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [reservation.part_number_id]);
  const pn = pnRes.rows[0];
  if (pn && pn.labeled_qty >= pn.declared_qty) {
    await pool.query("UPDATE part_numbers SET status = 'concluido' WHERE id = $1", [pn.id]);
  }
  res.json({ ok: true });
});

export default router;
