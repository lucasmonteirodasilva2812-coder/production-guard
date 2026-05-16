import express from 'express';
import cors from 'cors';
import { pool } from './pg.js';
import { addSseClient, removeSseClient, getActiveWorkstationIds, broadcast } from './sse.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import shipmentsRouter from './routes/shipments.js';
import partNumbersRouter from './routes/partNumbers.js';
import reservationsRouter from './routes/reservations.js';
import labelsRouter from './routes/labels.js';
import workstationsRouter from './routes/workstations.js';
import divergencesRouter from './routes/divergences.js';
import pnBaseRouter from './routes/pnBase.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

// CORS — allow any origin on local network
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ── Auth middleware (soft — attaches req.user if valid token) ─────────────────
app.use(async (req: any, _res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
    || (req.query._token as string | undefined) || '';
  if (token) {
    try {
      const { rows } = await pool.query(
        'SELECT s.user_id, u.role, u.name, u.username, u.is_blocked FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = $1 AND s.expires_at > $2',
        [token, new Date().toISOString()]
      );
      const session = rows[0];
      if (session && !session.is_blocked) {
        req.user = {
          id: session.user_id,
          name: session.name,
          username: session.username,
          role: session.role,
        };
      }
    } catch (err) {
      // ignora erro de auth
    }
  }
  next();
});
// ...restante do código segue normalmente...

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
app.use('/api/pn-base', pnBaseRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[backend] rodando em http://0.0.0.0:${PORT}`);
  console.log(`[backend] credenciais padrão: admin / admin123`);
});
