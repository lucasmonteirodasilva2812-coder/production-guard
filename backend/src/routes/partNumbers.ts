
import { Router } from 'express';
import { pool } from '../pg.js';

const router = Router();

router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM part_numbers ORDER BY id');
  res.json(result.rows.map(mapPN));
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body as { status: string };
  await pool.query('UPDATE part_numbers SET status = $1 WHERE id = $2', [status, req.params.id]);
  const rowRes = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [req.params.id]);
  res.json(mapPN(rowRes.rows[0]));
});

router.post('/:id/authorize-surplus', async (req, res) => {
  const { extraQty } = req.body as { extraQty: number };
  await pool.query('UPDATE part_numbers SET declared_qty = declared_qty + $1 WHERE id = $2', [extraQty, req.params.id]);
  const rowRes = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [req.params.id]);
  res.json(mapPN(rowRes.rows[0]));
});

function mapPN(row: any) {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    partNumber: row.part_number,
    description: row.description,
    declaredQty: row.declared_qty,
    labeledQty: row.labeled_qty,
    status: row.status,
  };
}

export default router;
