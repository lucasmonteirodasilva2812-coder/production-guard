import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Printer, AlertTriangle, CheckCircle, Clock,
  TrendingUp, TrendingDown, Activity, RefreshCw, Download,
  BarChart2, Layers, Zap,
} from 'lucide-react';
import { useShipments, usePartNumbers, useLabels, useDivergences, useWorkstations } from '@/hooks/useProductionData';
import { useAuthStore } from '@/store/authStore';

const BLUE_LT = '#60A5FA';
const BLUE_MID = '#3B82F6';
const BLUE_DK = '#1D4ED8';
const GREEN = '#34D399';
const AMBER = '#FBBF24';
const RED = '#F87171';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } }),
};

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(96,165,250,0.25)', borderRadius: 10,
      padding: '8px 14px', fontSize: 12, color: '#e2e8f0',
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 4, fontSize: 11 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || BLUE_LT, fontWeight: 700 }}>{p.value}</p>
      ))}
    </div>
  );
}

function GlassCard({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="visible" custom={delay}
      whileHover={{ y: -3, boxShadow: '0 24px 48px rgba(59,130,246,0.18)' }}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: 24, position: 'relative', ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

function KpiCard({ label, value, icon: Icon, color, trend, trendValue, delay }: {
  label: string; value: number | string; icon: any; color: string;
  trend?: 'up' | 'down' | 'neutral'; trendValue?: string; delay?: number;
}) {
  return (
    <GlassCard delay={delay ?? 0}>
      <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, borderRadius: 99 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</p>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} strokeWidth={2} />
        </div>
      </div>
      <p style={{ fontSize: 38, fontWeight: 800, color: '#f1f5f9', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>{value}</p>
      {trendValue && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {trend === 'up' && <TrendingUp size={12} color={GREEN} />}
          {trend === 'down' && <TrendingDown size={12} color={RED} />}
          <span style={{ fontSize: 11, color: trend === 'up' ? GREEN : trend === 'down' ? RED : 'rgba(148,163,184,0.7)', fontWeight: 600 }}>{trendValue}</span>
        </div>
      )}
    </GlassCard>
  );
}

export default function Dashboard() {
  const mode = useAuthStore(s => s.mode);
  const workstationId = useAuthStore(s => s.workstationId);
  const isOperator = mode === 'operador';

  const { data: shipments = [] } = useShipments();
  const { data: partNumbers = [] } = usePartNumbers();
  const { data: labelsAll = [] } = useLabels();
  const { data: divergences = [] } = useDivergences();
  const { data: workstations = [] } = useWorkstations();

  const labels = isOperator && workstationId
    ? labelsAll.filter((l: any) => l.workstationId === workstationId)
    : labelsAll;

  const pnConcluido = partNumbers.filter(p => p.status === 'concluido').length;
  const pnEmProcesso = partNumbers.filter(p => p.status === 'em_processo').length;
  const pnPendente = partNumbers.filter(p => p.status === 'pendente').length;
  const totalPn = partNumbers.length || 1;
  const completionRate = Math.round((pnConcluido / totalPn) * 100);
  const currentWS = workstations.find(w => w.id === workstationId);

  const labelsPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = 0;
    }
    labels.forEach((l: any) => {
      if (!l.printedAt) return;
      const d = new Date(l.printedAt);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (key in map) map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([dia, qty]) => ({ dia, qty }));
  }, [labels]);

  const labelsPerWs = useMemo(() => workstations.map(ws => ({
    name: ws.name.replace('Bancada ', 'B'),
    qty: labelsAll.filter((l: any) => l.workstationId === ws.id).length,
    online: ws.isOnline,
  })), [workstations, labelsAll]);

  const donutData = [
    { name: 'Concluidos', value: pnConcluido, color: GREEN },
    { name: 'Divergencias', value: divergences.length, color: RED },
    { name: 'Pendentes', value: pnPendente, color: AMBER },
    { name: 'Em Processo', value: pnEmProcesso, color: BLUE_LT },
  ].filter(d => d.value > 0);
  const donutTotal = donutData.reduce((a, b) => a + b.value, 0) || 1;
  const avgLabelsPerPn = totalPn > 1 ? (labelsAll.length / totalPn).toFixed(1) : '0';
  const recentDivergences = divergences.slice(0, 5);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)',
      padding: '28px 28px 48px',
      color: '#e2e8f0',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Marca dagua */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <span style={{ fontSize: 'clamp(80px,14vw,180px)', fontWeight: 900, color: 'rgba(255,255,255,0.022)', letterSpacing: '-0.04em', userSelect: 'none', whiteSpace: 'nowrap', textTransform: 'uppercase', transform: 'rotate(-12deg)' }}>MULTILASER</span>
      </div>
      <div aria-hidden style={{ position: 'fixed', top: -160, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div aria-hidden style={{ position: 'fixed', bottom: -200, left: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>

        {/* Topbar */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 600 }}>Production Guard · Grupo Multilaser</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
              Dashboard de Conferencia{isOperator ? ` - Bancada ${workstationId}` : ''}
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>
              {isOperator ? currentWS?.name : 'Visao geral · Controle de materia-prima'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 16px' }}>
              <Activity size={14} color={BLUE_LT} />
              <span style={{ fontSize: 12, color: BLUE_LT, fontWeight: 700 }}>{completionRate}% concluido</span>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 16px', color: 'rgba(226,232,240,0.85)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={13} />Atualizar
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: `linear-gradient(135deg, ${BLUE_MID}, ${BLUE_DK})`, border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, padding: '8px 16px', color: '#f1f5f9', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,130,246,0.35)' }}>
              <Download size={13} />Exportar
            </motion.button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: isOperator ? 'Etiquetas Geradas' : 'Total de Processos', value: isOperator ? labels.length : shipments.length, icon: isOperator ? Printer : Layers, color: BLUE_LT, trend: 'up' as const, trendValue: 'neste periodo' },
            { label: 'Etiquetas Impressas', value: labelsAll.length, icon: Printer, color: BLUE_MID, trend: 'up' as const, trendValue: `${avgLabelsPerPn} por PN` },
            { label: 'Produtos Conferidos', value: pnConcluido, icon: CheckCircle, color: GREEN, trend: 'up' as const, trendValue: `${completionRate}% do total` },
            { label: 'Divergencias', value: divergences.length, icon: AlertTriangle, color: AMBER, trend: divergences.length > 0 ? 'down' as const : 'neutral' as const, trendValue: divergences.length > 0 ? 'requer atencao' : 'sem divergencias' },
            { label: 'Pendentes', value: pnPendente, icon: Clock, color: RED, trend: 'neutral' as const, trendValue: `${pnEmProcesso} em processo` },
          ].map((kpi, i) => <KpiCard key={i} {...kpi} delay={i} />)}
        </div>

        {/* Area chart + Donut */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 20 }}>
          <GlassCard delay={5}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Etiquetas Impressas - Ultimos 7 dias</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{labels.length}</p>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: `${BLUE_LT}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={20} color={BLUE_LT} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={labelsPerDay} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BLUE_LT} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BLUE_LT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="qty" stroke={BLUE_LT} strokeWidth={2.5} fill="url(#areaG)"
                  dot={{ fill: BLUE_LT, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: BLUE_LT, strokeWidth: 2, stroke: 'rgba(255,255,255,0.3)' }} name="Etiquetas" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard delay={6}>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Distribuicao dos Processos</p>
            <p style={{ fontSize: 13, color: '#f1f5f9', marginBottom: 12 }}>{donutTotal} part numbers</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart width={200} height={160}>
                <Pie data={donutData.length ? donutData : [{ name: 'Vazio', value: 1, color: 'rgba(255,255,255,0.08)' }]}
                  cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" labelLine={false}>
                  {(donutData.length ? donutData : [{ color: 'rgba(255,255,255,0.08)' }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[
                { label: 'Concluidos', value: pnConcluido, color: GREEN },
                { label: 'Em Processo', value: pnEmProcesso, color: BLUE_LT },
                { label: 'Pendentes', value: pnPendente, color: AMBER },
                { label: 'Divergencias', value: divergences.length, color: RED },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.8)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <GlassCard delay={7}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>Etiquetas por Bancada</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{labelsAll.length} total</p>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${BLUE_MID}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={17} color={BLUE_MID} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={labelsPerWs} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="qty" radius={[6,6,0,0]} name="Etiquetas">
                  {labelsPerWs.map((entry, i) => (
                    <Cell key={i} fill={entry.online ? BLUE_LT : 'rgba(255,255,255,0.1)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard delay={8}>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Evolucao Semanal</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
              {labelsPerDay.reduce((a, b) => a + b.qty, 0)}{' '}
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', fontWeight: 500 }}>ultimos 7 dias</span>
            </p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={labelsPerDay} margin={{ top: 0, right: 4, bottom: 0, left: -28 }}>
                <defs>
                  <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={BLUE_DK} />
                    <stop offset="100%" stopColor={BLUE_LT} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Line type="monotone" dataKey="qty" stroke={`url(#lineG)`} strokeWidth={2.5} dot={false} name="Etiquetas" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Status das Bancadas</p>
              {(isOperator ? workstations.filter(w => w.id === workstationId) : workstations).map(ws => (
                <div key={ws.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderRadius: 8, background: ws.isOnline ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${ws.isOnline ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  <span style={{ fontSize: 11, color: 'rgba(226,232,240,0.8)', fontWeight: 500 }}>{ws.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: ws.isOnline ? GREEN : 'rgba(148,163,184,0.4)', boxShadow: ws.isOnline ? `0 0 6px ${GREEN}` : 'none' }} />
                    <span style={{ fontSize: 10, color: ws.isOnline ? GREEN : 'rgba(148,163,184,0.5)', fontWeight: 600 }}>{ws.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard delay={9}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>Ultimas Divergencias</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{divergences.length}</p>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${AMBER}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={17} color={AMBER} />
              </div>
            </div>
            {recentDivergences.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
                <CheckCircle size={28} color={GREEN} strokeWidth={1.5} />
                <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', textAlign: 'center' }}>Nenhuma divergencia registrada</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentDivergences.map((d: any, i: number) => (
                  <motion.div key={d.id || i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 9, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(226,232,240,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.partNumber || d.part_number || 'N/A'}</p>
                      <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)' }}>{d.type === 'sobra' ? 'Sobra' : d.type === 'falta' ? 'Falta' : d.type || 'Divergencia'}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: (d.difference ?? 0) > 0 ? AMBER : RED, flexShrink: 0 }}>
                      {(d.difference ?? 0) > 0 ? '+' : ''}{d.difference ?? 'N/A'}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ textAlign: 'center', marginTop: 40, fontSize: 11, color: 'rgba(148,163,184,0.35)', letterSpacing: '0.05em' }}>
          Production Guard · Grupo Multilaser · Sistema de Conferencia de Materia-Prima
        </motion.p>
      </div>
    </div>
  );
}
