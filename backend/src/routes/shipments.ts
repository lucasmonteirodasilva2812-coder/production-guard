import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db';
import { pool } from '../pg';
const isPg = !!process.env.DATABASE_URL;
import { broadcast } from '../sse';

const router = Router();

router.get('/', async (_req, res) => {
  let shipments;
  if (isPg) {
    const result = await pool.query('SELECT * FROM shipments ORDER BY imported_at DESC');
    shipments = result.rows;
  } else {
    shipments = db.prepare('SELECT * FROM shipments ORDER BY imported_at DESC').all();
  }
  res.json(shipments.map(mapShipment));
});

router.post('/', async (req, res) => {
  const { fileName, importedBy, parts } = req.body as {
    fileName: string;
    importedBy: string;
    parts: { partNumber: string; description: string; quantity: number }[];
  };

  if (!fileName || !parts?.length) {
    return res.status(400).json({ error: 'Nome da remessa e part numbers são obrigatórios' });
  }

  const shipmentId = uuid();
  const now = new Date().toISOString();
  const totalQty = parts.reduce((s, p) => s + (p.quantity || 0), 0);

  if (isPg) {
    await pool.query('INSERT INTO shipments (id, file_name, imported_at, imported_by, total_parts, total_quantity) VALUES ($1, $2, $3, $4, $5, $6)',
      [shipmentId, fileName, now, importedBy, parts.length, totalQty]);
    for (const p of parts) {
      await pool.query('INSERT INTO part_numbers (id, shipment_id, part_number, description, declared_qty, labeled_qty, status) VALUES ($1, $2, $3, $4, $5, 0, $6)',
        [uuid(), shipmentId, p.partNumber, p.description, p.quantity, 'pendente']);
    }
    const shipmentRes = await pool.query('SELECT * FROM shipments WHERE id = $1', [shipmentId]);
    const shipment = shipmentRes.rows[0];
    const mapped = mapShipment(shipment);
    broadcast('shipments:created', mapped);
    broadcast('part-numbers:updated', {});
    res.status(201).json(mapped);
  } else {
    db.prepare('INSERT INTO shipments (id, file_name, imported_at, imported_by, total_parts, total_quantity) VALUES (?, ?, ?, ?, ?, ?)')
      .run(shipmentId, fileName, now, importedBy, parts.length, totalQty);
    const insertPN = db.prepare(`INSERT INTO part_numbers (id, shipment_id, part_number, description, declared_qty, labeled_qty, status) VALUES (?, ?, ?, ?, ?, 0, 'pendente')`);
    db.transaction((items: typeof parts) => {
      for (const p of items) insertPN.run(uuid(), shipmentId, p.partNumber, p.description, p.quantity);
    })(parts);
    const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipmentId);
    const mapped = mapShipment(shipment);
    broadcast('shipments:created', mapped);
    broadcast('part-numbers:updated', {});
    res.status(201).json(mapped);
  }
});

function mapShipment(row: any) {
  return {
    id: row.id,
    fileName: row.file_name,
    importedAt: row.imported_at,
    importedBy: row.imported_by,
    totalParts: row.total_parts,
    totalQuantity: row.total_quantity,
  };
}

export default router;
