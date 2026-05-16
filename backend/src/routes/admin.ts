import { Router } from 'express';
import os from 'os';
import { pool } from '../pg.js';
import { getConnectedClients } from '../sse.js';

// xlsx imported with require to avoid ESM issues with ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const XLSX = require('xlsx');

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

router.get('/network-info', requireAdmin, (_req, res) => {
  const port = process.env.PORT || 3001;
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface || []) {
      if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address);
    }
  }
  res.json({ port, ips });
});

router.get('/connected-clients', requireAdmin, (_req, res) => {
  res.json(getConnectedClients());
});

router.get('/backup', requireAdmin, async (_req, res) => {
  const tables = ['shipments', 'part_numbers', 'reservations', 'labels', 'workstations', 'divergences', 'users', 'label_sequence'];
  const backup: Record<string, any[]> = {};
  for (const t of tables) {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${t}`);
      backup[t] = rows;
    } catch {}
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(backup);
});

router.post('/restore', requireAdmin, async (req, res) => {
  const data = req.body as Record<string, any[]>;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Dados inválidos' });
  try {
    // Limpa tabelas
    await pool.query('DELETE FROM quality_checks');
    await pool.query('DELETE FROM divergences');
    await pool.query('DELETE FROM print_jobs');
    await pool.query('DELETE FROM labels');
    await pool.query('DELETE FROM reservations');
    await pool.query('DELETE FROM part_numbers');
    await pool.query('DELETE FROM shipments');
    // Restaura dados
    if (data.shipments) {
      for (const r of data.shipments) {
        await pool.query('INSERT INTO shipments (id, file_name, imported_at, imported_by, total_parts, total_quantity) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET file_name = $2, imported_at = $3, imported_by = $4, total_parts = $5, total_quantity = $6', [r.id, r.file_name, r.imported_at, r.imported_by, r.total_parts, r.total_quantity]);
      }
    }
    if (data.part_numbers) {
      for (const r of data.part_numbers) {
        await pool.query('INSERT INTO part_numbers (id, shipment_id, part_number, description, declared_qty, labeled_qty, status) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET shipment_id = $2, part_number = $3, description = $4, declared_qty = $5, labeled_qty = $6, status = $7', [r.id, r.shipment_id, r.part_number, r.description, r.declared_qty, r.labeled_qty, r.status]);
      }
    }
    if (data.labels) {
      for (const r of data.labels) {
        await pool.query(`INSERT INTO labels (id, label_seq_id, composite_id, part_number_id, part_number, description, quantity, workstation_id, printed_at, printed_by, zpl_command, qr_validated, print_job_id, msl, expiry_date, label_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO UPDATE SET label_seq_id=$2, composite_id=$3, part_number_id=$4, part_number=$5, description=$6, quantity=$7, workstation_id=$8, printed_at=$9, printed_by=$10, zpl_command=$11, qr_validated=$12, print_job_id=$13, msl=$14, expiry_date=$15, label_type=$16`, [r.id, r.label_seq_id || '', r.composite_id, r.part_number_id, r.part_number, r.description, r.quantity, r.workstation_id, r.printed_at, r.printed_by, r.zpl_command || '', r.qr_validated || 0, r.print_job_id || '', r.msl || null, r.expiry_date || null, r.label_type || 'normal']);
      }
    }
    if (data.label_sequence?.[0]) {
      await pool.query('UPDATE label_sequence SET last_value = $1 WHERE id = 1', [data.label_sequence[0].last_value]);
    }
    res.json({ ok: true, message: 'Backup restaurado com sucesso' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/export/excel', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      pn.part_number  AS "PRODUTOS",
      pn.description  AS "DESCRIÇÃO",
      s.file_name     AS "REMESSA_NOME",
      pn.declared_qty AS "REMESSA",
      pn.labeled_qty  AS "FISICO",
      (pn.labeled_qty - pn.declared_qty) AS "DIFERENÇA",
      pn.status       AS "STATUS"
    FROM part_numbers pn
    LEFT JOIN shipments s ON s.id = pn.shipment_id
    ORDER BY s.imported_at, pn.part_number
  `);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Part Numbers');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="export-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  res.send(buf);
});

export default router;
