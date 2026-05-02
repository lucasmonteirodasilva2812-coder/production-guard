import { Router } from 'express';
import db from '../db';

const router = Router();

// GET all
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM pn_base ORDER BY part_number').all();
  res.json(rows.map(mapRow));
});

// GET lookup by part number (case-insensitive)
router.get('/lookup/:pn', (req, res) => {
  const row = db.prepare('SELECT * FROM pn_base WHERE LOWER(part_number) = LOWER(?)').get(req.params.pn) as any;
  if (!row) return res.status(404).json({ error: 'Não encontrado na base' });
  res.json(mapRow(row));
});

// POST import — upsert many
router.post('/import', (req, res) => {
  const { items } = req.body as { items: { partNumber: string; description: string; msl?: string }[] };
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nenhum item fornecido' });
  }

  const upsert = db.prepare(`
    INSERT INTO pn_base (part_number, description, msl, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(part_number) DO UPDATE SET
      description = excluded.description,
      msl = excluded.msl,
      updated_at = excluded.updated_at
  `);

  const now = new Date().toISOString();
  const importMany = db.transaction((list: typeof items) => {
    for (const item of list) {
      const pn = (item.partNumber || '').trim();
      if (!pn) continue;
      upsert.run(pn, (item.description || '').trim(), (item.msl || '').trim() || null, now);
    }
  });

  importMany(items);
  res.json({ imported: items.length });
});

function mapRow(row: any) {
  return {
    partNumber: row.part_number,
    description: row.description,
    msl: row.msl,
    updatedAt: row.updated_at,
  };
}

export default router;
