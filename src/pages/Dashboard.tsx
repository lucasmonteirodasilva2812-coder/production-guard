import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Zap, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/card';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip';
import { useLabels, useDivergences, useWorkstations } from '../hooks/useProductionData';

const BLUE_MID = '#3B5BDB';
const BLUE_LT = '#93C5FD';
const GREEN = '#34D399';

export default function Dashboard() {
  const { data: labelsAll = [] } = useLabels();
  const { data: divergences = [] } = useDivergences();
  const { data: workstations = [] } = useWorkstations();

  // Monta dados para o gráfico
  const labelsPerWs = workstations.map(ws => ({
    name: ws.name,
    qty: labelsAll.filter(l => l.workstationId === ws.id).length,
    online: ws.isOnline,
  }));

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <Card style={{ flex: 1, minWidth: 340, background: 'rgba(30,41,59,0.85)', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>Etiquetas por Bancada</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{labelsAll.length}</p>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `${BLUE_MID}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={17} color={BLUE_MID} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={labelsPerWs} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${labelsAll.length ? Math.round((v / labelsAll.length) * 100) : 0}%`} tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <ReTooltip />
              <Bar dataKey="qty" radius={[6,6,0,0]} name="Etiquetas">
                {labelsPerWs.map((entry, i) => (
                  <Cell key={i} fill={entry.online ? BLUE_LT : 'rgba(255,255,255,0.1)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {labelsPerWs.map(ws => (
              <span key={ws.name} style={{ fontSize: 11, color: '#93C5FD', background: 'rgba(59,91,219,0.08)', borderRadius: 8, padding: '3px 10px', fontWeight: 600 }}>
                {ws.name}: {labelsAll.length ? Math.round((ws.qty / labelsAll.length) * 100) : 0}%
              </span>
            ))}
          </div>
        </Card>

        <Card style={{ flex: 1, minWidth: 340, background: 'rgba(30,41,59,0.85)', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>Divergências Resolvidas</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{divergences.filter(d => d.status === 'resolvida').length}</p>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `${GREEN}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={17} color={GREEN} />
            </div>
          </div>
          {divergences.filter(d => d.status === 'resolvida').length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
              <CheckCircle size={28} color={GREEN} strokeWidth={1.5} />
              <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', textAlign: 'center' }}>Nenhuma divergência resolvida</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {divergences.filter(d => d.status === 'resolvida').slice(0, 5).map((d, i) => (
                <motion.div key={d.id || i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 9, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(226,232,240,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.partNumber || d.part_number || 'N/A'}</p>
                    <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>{d.type === 'sobra' ? 'Sobra' : d.type === 'falta' ? 'Falta' : d.type || 'Divergência'}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, flexShrink: 0 }}>Resolvida</span>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{ textAlign: 'center', marginTop: 40, fontSize: 11, color: 'rgba(148,163,184,0.35)', letterSpacing: '0.05em' }}>
        Production Guard · Grupo Multilaser · Sistema de Conferência de Matéria-Prima
      </motion.p>
    </div>
  );
}
