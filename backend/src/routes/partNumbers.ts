import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM part_numbers ORDER BY rowid').all();
  res.json(rows.map(mapPN));
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body as { status: string };
  db.prepare('UPDATE part_numbers SET status = ? WHERE id = ?').run(status, req.params.id);
  const row = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(req.params.id);
  res.json(mapPN(row));
});

router.post('/:id/authorize-surplus', (req, res) => {
  const { extraQty } = req.body as { extraQty: number };
  db.prepare('UPDATE part_numbers SET declared_qty = declared_qty + ? WHERE id = ?').run(extraQty, req.params.id);
  const row = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(req.params.id);
  res.json(mapPN(row));
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
