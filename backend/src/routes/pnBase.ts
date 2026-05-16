
import { Router } from 'express';
import { pool } from '../pg.js';

const router = Router();

// GET all
router.get('/', async (_req, res) => {
  const result = await pool.query('SELECT * FROM pn_base ORDER BY part_number');
  res.json(result.rows.map(mapRow));
});

// GET lookup by part number (case-insensitive)
router.get('/lookup/:pn', async (req, res) => {
  const result = await pool.query('SELECT * FROM pn_base WHERE LOWER(part_number) = LOWER($1)', [req.params.pn]);
  const row = result.rows[0];
  if (!row) return res.status(404).json({ error: 'Não encontrado na base' });
  res.json(mapRow(row));
});

// POST import — upsert many
router.post('/import', async (req, res) => {
  const { items } = req.body as { items: { partNumber: string; description: string; msl?: string }[] };
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Nenhum item fornecido' });
  }

  const now = new Date().toISOString();
  for (const item of items) {
    const pn = (item.partNumber || '').trim();
    if (!pn) continue;
    await pool.query(`
      INSERT INTO pn_base (part_number, description, msl, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(part_number) DO UPDATE SET
        description = EXCLUDED.description,
        msl = EXCLUDED.msl,
        updated_at = EXCLUDED.updated_at
    `, [pn, (item.description || '').trim(), (item.msl || '').trim() || null, now]);
  }
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
