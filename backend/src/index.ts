import express from 'express';
import cors from 'cors';
import db from './db';
import { addSseClient, removeSseClient, getActiveWorkstationIds, broadcast } from './sse';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import adminRouter from './routes/admin';
import shipmentsRouter from './routes/shipments';
import partNumbersRouter from './routes/partNumbers';
import reservationsRouter from './routes/reservations';
import labelsRouter from './routes/labels';
import workstationsRouter from './routes/workstations';
import divergencesRouter from './routes/divergences';

const app = express();
const PORT = Number(process.env.PORT || 3001);

// CORS — allow any origin on local network
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ── Auth middleware (soft — attaches req.user if valid token) ─────────────────
app.use((req: any, _res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
    || (req.query._token as string | undefined) || '';
  if (token) {
    const session = db.prepare(`
      SELECT s.user_id, u.role, u.name, u.username, u.is_blocked
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?
    `).get(token, new Date().toISOString()) as any;
    if (session && !session.is_blocked) {
      req.user = { id: session.user_id, role: session.role, name: session.name, username: session.username };
    }
  }
  next();
});

// Healthcheck para Render
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── SSE endpoint ──────────────────────────────────────────────────────────────
app.get('/api/sse', (req: any, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const userId = req.user?.id || 'anonymous';
  const userName = req.user?.name || 'Anônimo';
  const userRole = req.user?.role || 'operador';
  const wsId = req.query.workstationId ? Number(req.query.workstationId) : undefined;

  const clientId = addSseClient(userId, userName, userRole, wsId, res);

  // Marcar bancada como online ao conectar
  if (wsId) {
    db.prepare('UPDATE workstations SET is_online = 1 WHERE id = ?').run(wsId);
    broadcast('workstations:updated', {});
  }

  // Heartbeat
  const hb = setInterval(() => {
    try { res.write(':heartbeat\n\n'); } catch { clearInterval(hb); }
  }, 30_000);

  req.on('close', () => {
    clearInterval(hb);
    removeSseClient(clientId);
    // Marcar bancada como offline se não houver mais clientes nela
    if (wsId && !getActiveWorkstationIds().has(wsId)) {
      db.prepare('UPDATE workstations SET is_online = 0 WHERE id = ?').run(wsId);
      broadcast('workstations:updated', {});
    }
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/part-numbers', partNumbersRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/labels', labelsRouter);
app.use('/api/workstations', workstationsRouter);
app.use('/api/divergences', divergencesRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[backend] rodando em http://0.0.0.0:${PORT}`);
  console.log(`[backend] credenciais padrão: admin / admin123`);
});
