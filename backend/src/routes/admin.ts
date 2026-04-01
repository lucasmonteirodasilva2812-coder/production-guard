import { Router } from 'express';
import os from 'os';
import db from '../db';
import { getConnectedClients } from '../sse';

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

router.get('/backup', requireAdmin, (_req, res) => {
  const tables = ['shipments', 'part_numbers', 'reservations', 'labels', 'workstations', 'divergences', 'users', 'label_sequence'];
  const backup: Record<string, any[]> = {};
  for (const t of tables) {
    try { backup[t] = db.prepare(`SELECT * FROM ${t}`).all(); } catch {}
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(backup);
});

router.post('/restore', requireAdmin, (req, res) => {
  const data = req.body as Record<string, any[]>;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Dados inválidos' });

  try {
    db.transaction(() => {
      db.exec(`
        DELETE FROM quality_checks;
        DELETE FROM divergences;
        DELETE FROM print_jobs;
        DELETE FROM labels;
        DELETE FROM reservations;
        DELETE FROM part_numbers;
        DELETE FROM shipments;
      `);

      if (data.shipments) {
        const ins = db.prepare('INSERT OR REPLACE INTO shipments VALUES (?,?,?,?,?,?)');
        for (const r of data.shipments) ins.run(r.id, r.file_name, r.imported_at, r.imported_by, r.total_parts, r.total_quantity);
      }
      if (data.part_numbers) {
        const ins = db.prepare('INSERT OR REPLACE INTO part_numbers VALUES (?,?,?,?,?,?,?)');
        for (const r of data.part_numbers) ins.run(r.id, r.shipment_id, r.part_number, r.description, r.declared_qty, r.labeled_qty, r.status);
      }
      if (data.labels) {
        const ins = db.prepare(`INSERT OR REPLACE INTO labels
          (id, label_seq_id, composite_id, part_number_id, part_number, description, quantity,
           workstation_id, printed_at, printed_by, zpl_command, qr_validated, print_job_id, msl, expiry_date, label_type)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
        for (const r of data.labels) {
          ins.run(r.id, r.label_seq_id || '', r.composite_id, r.part_number_id, r.part_number,
            r.description, r.quantity, r.workstation_id, r.printed_at, r.printed_by,
            r.zpl_command || '', r.qr_validated || 0, r.print_job_id || '',
            r.msl || null, r.expiry_date || null, r.label_type || 'normal');
        }
      }
      if (data.label_sequence?.[0]) {
        db.prepare('UPDATE label_sequence SET last_value = ? WHERE id = 1').run(data.label_sequence[0].last_value);
      }
    })();
    res.json({ ok: true, message: 'Backup restaurado com sucesso' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/export/excel', requireAdmin, (_req, res) => {
  const rows = db.prepare(`
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
  `).all();

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Part Numbers');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="export-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  res.send(buf);
});

export default router;
