import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM divergences ORDER BY created_at DESC').all();
  res.json(rows.map(mapDivergence));
});

router.post('/finalize/:partNumberId', (req, res) => {
  const { createdBy } = req.body as { createdBy: string };
  const pn = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(req.params.partNumberId) as any;
  if (!pn) return res.status(404).json({ error: 'Part number não encontrado' });

  const diff = pn.labeled_qty - pn.declared_qty;

  if (diff === 0) {
    db.prepare("UPDATE part_numbers SET status = 'concluido' WHERE id = ?").run(pn.id);
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

  db.prepare(`
    INSERT INTO divergences (id, part_number_id, part_number, declared_qty, labeled_qty, difference, type, created_at, created_by, resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(report.id, report.partNumberId, report.partNumber, report.declaredQty, report.labeledQty, report.difference, report.type, report.createdAt, report.createdBy);

  db.prepare("UPDATE part_numbers SET status = 'divergente' WHERE id = ?").run(pn.id);

  res.status(201).json({ divergence: report });
});

router.patch('/:id/resolve', (req, res) => {
  db.prepare('UPDATE divergences SET resolved = 1 WHERE id = ?').run(req.params.id);
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
