
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../pg.js';
import { broadcast } from '../sse.js';

const router = Router();

// LOG helper
function logLabelError(context, err, extra = {}) {
  console.error(`[labels] ERRO [${context}]`, err, extra);
}

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM labels ORDER BY printed_at DESC');
    res.json(result.rows);
  } catch (err) {
    logLabelError('GET /', err);
    res.status(500).json({ error: 'Erro ao buscar etiquetas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { partNumberId, reservationId, workstationId, printedBy, msl, expiryDate, labelType = 'normal', description: descriptionOverride } = req.body as {
      partNumberId: string;
      reservationId: string;
      workstationId: number;
      printedBy: string;
      msl?: string;
      expiryDate?: string;
      labelType?: string;
      description?: string;
    };

    if (!partNumberId || !reservationId || !workstationId || !printedBy) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const pnRes = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [partNumberId]);
    const pn = pnRes.rows[0];
    const resvRes = await pool.query('SELECT * FROM reservations WHERE id = $1', [reservationId]);
    const reservation = resvRes.rows[0];
    const wsRes = await pool.query('SELECT * FROM workstations WHERE id = $1', [workstationId]);
    const ws = wsRes.rows[0];
    if (!pn || !reservation) return res.status(404).json({ error: 'Part number ou reserva não encontrados' });

    const qty = reservation.quantity;
    const seqRes = await pool.query('UPDATE label_sequence SET last_value = last_value + 1 RETURNING last_value');
    const seqId = seqRes.rows[0].last_value;

    // Composite ID: YYMMDDHHmmss (12 chars, timestamp-based)
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const compositeId = `${yy}${mo}${dd}${hh}${mi}${ss}`;

    // Geração ZPL (simulado)
    const zpl = `^XA^FO50,50^A0N,40,40^FD${pn.part_number}^FS^FO50,100^A0N,30,30^FD${pn.description}^FS^FO50,150^A0N,25,25^FDQTD: ${qty}^FS^FO50,190^A0N,25,25^FDID: ${seqId}^FS^FO50,230^BQN,2,6^FDQA,${seqId}|${pn.part_number}|${qty}^FS^XZ`;

    const labelId = uuid();
    const jobId = uuid();
    const printedAt = now.toISOString();

    await pool.query(`
      INSERT INTO labels (id, label_seq_id, composite_id, part_number_id, part_number, description, quantity,
        workstation_id, printed_at, printed_by, zpl_command, qr_validated, print_job_id, msl, expiry_date, label_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12, $13, $14, $15)
    `, [labelId, seqId, compositeId, partNumberId, pn.part_number, descriptionOverride || pn.description, qty,
      workstationId, printedAt, printedBy, zpl, jobId, msl || null, expiryDate || null, labelType]);

    // Em ambiente cloud, não imprime — retorna ZPL para download
    const isCloud = process.env.RENDER || process.env.NODE_ENV === 'production';
    let printJobStatus = 'skipped';
    if (!isCloud) {
      await pool.query(`INSERT INTO print_jobs (id, label_id, status, printer_ip, created_at, retries) VALUES ($1, $2, 'queued', $3, $4, 0)`,
        [jobId, labelId, ws?.printer_ip || '', printedAt]);
      await pool.query("UPDATE print_jobs SET status = 'printed', completed_at = $1 WHERE id = $2", [new Date().toISOString(), jobId]);
      printJobStatus = 'printed';
    }

    await pool.query("UPDATE reservations SET status = 'consumido' WHERE id = $1", [reservationId]);
    await pool.query("UPDATE part_numbers SET labeled_qty = labeled_qty + $1, status = CASE WHEN status = 'pendente' THEN 'em_processo' ELSE status END WHERE id = $2", [qty, partNumberId]);
    const updatedPNRes = await pool.query('SELECT * FROM part_numbers WHERE id = $1', [partNumberId]);
    const updatedPN = updatedPNRes.rows[0];
    if (updatedPN && updatedPN.labeled_qty >= updatedPN.declared_qty) {
      await pool.query("UPDATE part_numbers SET status = 'concluido' WHERE id = $1", [partNumberId]);
    }

    // Sucesso: retorna dados da etiqueta
    res.json({
      id: labelId,
      labelSeqId: seqId,
      compositeId,
      partNumberId,
      description: descriptionOverride || pn.description,
      quantity: qty,
      workstationId,
      printedAt,
      printedBy,
      zpl,
      printJobStatus,
      msl,
      expiryDate,
      labelType
    });
  } catch (err) {
    logLabelError('POST /', err);
    res.status(500).json({ error: 'Erro ao criar etiqueta' });
  }
});

export default router;

