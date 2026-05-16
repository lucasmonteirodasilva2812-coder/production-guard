import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../pg.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM divergences ORDER BY created_at DESC');
  res.json(rows.map(mapDivergence));
});

router.post('/finalize/:partNumberId', async (req, res) => {
  const { createdBy } = req.body as { createdBy: string };
  const { rows } = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [req.params.partNumberId]);
  const pn = rows[0];
  if (!pn) return res.status(404).json({ error: 'Part number não encontrado' });

  const diff = pn.labeled_qty - pn.declared_qty;

  if (diff === 0) {
    await pool.query("UPDATE part_numbers SET status = 'concluido' WHERE id = $1", [pn.id]);
    return res.json({ divergence: null });
  }

  const report = {
    id: uuid(),
    partNumberId: pn.id,
    partNumber: pn.part_number,
    declaredQty: pn.declared_qty,
    labeledQty: pn.labeled_qty,
    difference: diff,
    type: diff < 0 ? 'falta' : 'sobra',
    createdAt: new Date().toISOString(),
    createdBy,
    resolved: false,
  };

  await pool.query(`
    INSERT INTO divergences (id, part_number_id, part_number, declared_qty, labeled_qty, difference, type, created_at, created_by, resolved)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
  `, [report.id, report.partNumberId, report.partNumber, report.declaredQty, report.labeledQty, report.difference, report.type, report.createdAt, report.createdBy]);

  await pool.query("UPDATE part_numbers SET status = 'divergente' WHERE id = $1", [pn.id]);

  res.status(201).json({ divergence: report });
});

router.patch('/:id/resolve', async (req, res) => {
  await pool.query('UPDATE divergences SET resolved = 1 WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

function mapDivergence(row: any) {
  return {
    id: row.id,
    partNumberId: row.part_number_id,
    partNumber: row.part_number,
    declaredQty: row.declared_qty,
    labeledQty: row.labeled_qty,
    difference: row.difference,
    type: row.type,
    createdAt: row.created_at,
    createdBy: row.created_by,
    resolved: Boolean(row.resolved),
  };
}

export default router;
