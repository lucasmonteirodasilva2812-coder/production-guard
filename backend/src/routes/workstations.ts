import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM workstations ORDER BY id').all();
  res.json(rows.map(mapWS));
});

router.patch('/:id', (req, res) => {
  const { printerIp, printerPort, isOnline } = req.body as {
    printerIp?: string;
    printerPort?: number;
    isOnline?: boolean;
  };

  const fields: string[] = [];
  const values: any[] = [];

  if (printerIp !== undefined) { fields.push('printer_ip = ?'); values.push(printerIp); }
  if (printerPort !== undefined) { fields.push('printer_port = ?'); values.push(printerPort); }
  if (isOnline !== undefined) { fields.push('is_online = ?'); values.push(isOnline ? 1 : 0); }

  if (fields.length > 0) {
    values.push(req.params.id);
    db.prepare(`UPDATE workstations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const row = db.prepare('SELECT * FROM workstations WHERE id = ?').get(req.params.id);
  res.json(mapWS(row));
});

function mapWS(row: any) {
  return {
    id: row.id,
    name: row.name,
    printerIp: row.printer_ip,
    printerPort: row.printer_port,
    isOnline: Boolean(row.is_online),
  };
}

export default router;
