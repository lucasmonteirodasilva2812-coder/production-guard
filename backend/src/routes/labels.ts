import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db, { nextLabelSeqId } from '../db';
import { broadcast } from '../sse';

const router = Router();

// LOG helper
function logLabelError(context, err, extra = {}) {
  console.error(`[labels] ERRO [${context}]`, err, extra);
}

router.get('/', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM labels ORDER BY printed_at DESC').all();
    res.json(rows.map(mapLabel));
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

    const pn = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(partNumberId) as any;
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as any;
    const ws = db.prepare('SELECT * FROM workstations WHERE id = ?').get(workstationId) as any;
    if (!pn || !reservation) return res.status(404).json({ error: 'Part number ou reserva não encontrados' });

    const qty = reservation.quantity;
    const seqId = nextLabelSeqId();

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

    db.prepare(`
      INSERT INTO labels (id, label_seq_id, composite_id, part_number_id, part_number, description, quantity,
        workstation_id, printed_at, printed_by, zpl_command, qr_validated, print_job_id, msl, expiry_date, label_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
    `).run(labelId, seqId, compositeId, partNumberId, pn.part_number, descriptionOverride || pn.description, qty,
      workstationId, printedAt, printedBy, zpl, jobId, msl || null, expiryDate || null, labelType);

    // Em ambiente cloud, não imprime — retorna ZPL para download
    const isCloud = process.env.RENDER || process.env.NODE_ENV === 'production';
    let printJobStatus = 'skipped';
    if (!isCloud) {
      db.prepare(`INSERT INTO print_jobs (id, label_id, status, printer_ip, created_at, retries) VALUES (?, ?, 'queued', ?, ?, 0)`)
        .run(jobId, labelId, ws?.printer_ip || '', printedAt);
      db.prepare("UPDATE print_jobs SET status = 'printed', completed_at = ? WHERE id = ?").run(new Date().toISOString(), jobId);
      printJobStatus = 'printed';
    }

    db.prepare("UPDATE reservations SET status = 'consumido' WHERE id = ?").run(reservationId);
    db.prepare("UPDATE part_numbers SET labeled_qty = labeled_qty + ?, status = CASE WHEN status = 'pendente' THEN 'em_processo' ELSE status END WHERE id = ?").run(qty, partNumberId);

    const updatedPN = db.prepare('SELECT * FROM part_numbers WHERE id = ?').get(partNumberId) as any;
    if (updatedPN && updatedPN.labeled_qty >= updatedPN.declared_qty) {
      db.prepare("UPDATE part_numbers SET status = 'concluido' WHERE id = ?").run(partNumberId);
    }

    const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(labelId);
    const mappedLabel = mapLabel(label);

    broadcast('labels:created', mappedLabel);
    broadcast('part-numbers:updated', { id: partNumberId });

    // Se cloud, retorna ZPL para download
    if (isCloud) {
      let zplBase64 = null;
      let bufferError = null;
      try {
        if (typeof Buffer !== 'undefined' && Buffer.from) {
          zplBase64 = Buffer.from(zpl).toString('base64');
        } else {
          bufferError = 'Buffer não está disponível no ambiente Node';
        }
      } catch (e) {
        bufferError = 'Erro ao usar Buffer: ' + (e && e.stack ? e.stack : String(e));
      }
      if (bufferError) {
        logLabelError('POST / Buffer', bufferError, { typeofBuffer: typeof Buffer, env: process?.env, body: req.body });
        return res.status(500).json({ error: 'Ambiente não suporta Buffer para base64', details: bufferError });
      }
      res.status(201).json({ ...mappedLabel, zplDownload: zplBase64 });
    } else {
      res.status(201).json(mappedLabel);
    }
  } catch (err) {
    // Log detalhado para debug em produção
    logLabelError('POST /', err, {
      body: req.body,
      stack: err && err.stack ? err.stack : undefined,
      typeofBuffer: typeof Buffer,
      typeofProcess: typeof process,
      env: typeof process !== 'undefined' && process.env ? process.env : undefined,
    });
    res.status(500).json({ error: 'Erro ao criar etiqueta', details: String(err) });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.id) as any;
    if (!label) return res.status(404).json({ error: 'Etiqueta não encontrada' });

    db.prepare('DELETE FROM labels WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE part_numbers SET labeled_qty = MAX(0, labeled_qty - ?) WHERE id = ?')
      .run(label.quantity, label.part_number_id);

    broadcast('labels:deleted', { id: req.params.id });
    broadcast('part-numbers:updated', { id: label.part_number_id });

    res.json({ ok: true });
  } catch (err) {
    logLabelError('DELETE /:id', err, { id: req.params.id });
    res.status(500).json({ error: 'Erro ao deletar etiqueta', details: String(err) });
  }
});

router.post('/:id/reprint', (req, res) => {
  try {
    const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.id) as any;
    if (!label) return res.status(404).json({ error: 'Etiqueta não encontrada' });

    const { printerIp } = req.body as { printerIp: string };
    const jobId = uuid();
    db.prepare(`INSERT INTO print_jobs (id, label_id, status, printer_ip, created_at, retries) VALUES (?, ?, 'printed', ?, ?, 0)`)
      .run(jobId, label.id, printerIp || '', new Date().toISOString());

    res.status(201).json({ jobId });
  } catch (err) {
    logLabelError('POST /:id/reprint', err, { id: req.params.id, body: req.body });
    res.status(500).json({ error: 'Erro ao reimprimir etiqueta', details: String(err) });
  }
});

function mapLabel(row: any) {
  return {
    id: row.id,
    labelSeqId: row.label_seq_id || '',
    compositeId: row.composite_id,
    partNumberId: row.part_number_id,
    partNumber: row.part_number,
    description: row.description,
    quantity: row.quantity,
    workstationId: row.workstation_id,
    printedAt: row.printed_at,
    printedBy: row.printed_by,
    zplCommand: row.zpl_command || '',
    qrValidated: Boolean(row.qr_validated),
    printJobId: row.print_job_id || '',
    msl: row.msl || null,
    expiryDate: row.expiry_date || null,
    labelType: row.label_type || 'normal',
  };
}

export default router;
