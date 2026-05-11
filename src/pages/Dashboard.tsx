        {/* Telinha lateral de divergências */}
        {divergences.filter(d => d.status !== 'resolvida').length > 0 && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: 0, right: -370, width: 340, height: '100%',
              background: 'rgba(15,23,42,0.92)',
              border: '1px solid rgba(248,113,113,0.18)',
              borderRadius: 18, boxShadow: '0 8px 32px rgba(248,113,113,0.13)',
              padding: '24px 22px', zIndex: 10, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={18} color={RED} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Divergências em aberto</span>
            </div>
            {divergences.filter(d => d.status !== 'resolvida').map((d, idx) => (
              <div key={d.id || idx} style={{
                background: 'rgba(248,113,113,0.07)',
                border: '1px solid rgba(248,113,113,0.13)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e7ef' }}>{d.partNumber || d.part_number || 'N/A'}</span>
                <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)' }}>{d.type === 'sobra' ? 'Sobra' : d.type === 'falta' ? 'Falta' : d.type || 'Divergência'}</span>
                <span style={{ fontSize: 11, color: RED, fontWeight: 600 }}>Status: {d.status}</span>
              </div>
            ))}
          </motion.div>
        )}
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

// FIM DO ARQUIVO: não adicionar nada após esta linha
function GlassCard({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="visible" custom={delay}
      whileHover={{ y: -3, boxShadow: '0 24px 48px rgba(59,130,246,0.18)' }}
      style={{
        background: 'rgba(17,24,39,0.72)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
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

  // Evolução semanal removida

  const labelsPerWs = useMemo(() => workstations.map(ws => ({
    name: ws.name.replace('Bancada ', 'B'),
    qty: labelsAll.filter((l: any) => l.workstationId === ws.id).length,
    online: ws.isOnline,
  })), [workstations, labelsAll]);

  // Só processos finalizados
  const pnFinalizados = partNumbers.filter(p => p.status === 'concluido');
  const donutData = pnFinalizados.map(p => ({
    name: p.part_number || p.partNumber || 'Processo',
    value: 1,
    color: GREEN,
  }));
  const donutTotal = donutData.length || 1;
  const avgLabelsPerPn = totalPn > 1 ? (labelsAll.length / totalPn).toFixed(1) : '0';
  const recentDivergences = divergences.slice(0, 5);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #090E1A 0%, #101624 50%, #090E1A 100%)',
      padding: '28px 28px 48px',
      color: '#e2e8f0',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Marca d'água e logos Multilaser */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <span style={{ fontSize: 'clamp(80px,14vw,180px)', fontWeight: 900, color: 'rgba(96,165,250,0.018)', letterSpacing: '-0.04em', userSelect: 'none', whiteSpace: 'nowrap', textTransform: 'uppercase', transform: 'rotate(-12deg)' }}>MULTILASER</span>
      </div>
      <div aria-hidden style={{ position: 'fixed', top: -160, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div aria-hidden style={{ position: 'fixed', bottom: -200, left: -100, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.11) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Logo Multilaser SVG (igual tela inicial) */}
      <div style={{ position: 'absolute', top: 32, left: 32, zIndex: 2, opacity: 0.97 }}>
        <svg width="140" height="38" viewBox="0 0 140 38" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="28" fontFamily="'Inter', Arial, sans-serif" fontWeight="900" fontSize="32" fill="#60A5FA" letterSpacing="-0.04em">MULTILASER</text>
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>

        {/* Topbar */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12, position: 'relative' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="19" cy="19" r="19" fill="#3B82F6" fillOpacity="0.13" />
                <text x="7" y="27" fontFamily="'Inter', Arial, sans-serif" fontWeight="900" fontSize="18" fill="#60A5FA">M</text>
              </svg>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4, fontWeight: 600 }}>Production Guard · Grupo Multilaser</p>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
                  Dashboard de Conferência{isOperator ? ` - Bancada ${workstationId}` : ''}
                </h1>
                <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>
                  {isOperator ? currentWS?.name : 'Visão geral · Controle de matéria-prima'}
                </p>
              </div>
            </div>
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

        {/* KPI Cards + Telinha lateral */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginBottom: 28, position: 'relative' }}>
          <KpiCard
            label="Processos em conferência"
            value={pnEmProcesso}
                </div>
              ))}
            </motion.div>
          )}
          {/* Tabela de colaboradores que mais conferiram produtos nos processos em conferência */}
          <GlassCard delay={5}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Top Colaboradores</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>Produtos em conferência</p>
              </div>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#93C5FD', fontWeight: 700, background: 'rgba(59,91,219,0.07)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Colaborador</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px' }}>Itens</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const emConferenciaIds = partNumbers.filter(p => p.status === 'em_processo').map(p => p.id);
                    const labelsEmConf = labelsAll.filter(l => emConferenciaIds.includes(l.partNumberId));
                    const userMap: Record<string, { name: string, qty: number }> = {};
                    labelsEmConf.forEach(l => {
                      const user = l.userName || l.user_name || l.user || 'Desconhecido';
                      if (!userMap[user]) userMap[user] = { name: user, qty: 0 };
                      userMap[user].qty += l.quantity || 1;
                    });
                    const sorted = Object.values(userMap).sort((a, b) => b.qty - a.qty).slice(0, 8);
                    if (sorted.length === 0) return (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'rgba(148,163,184,0.6)', padding: 18 }}>Nenhum colaborador encontrado</td></tr>
                    );
                    return sorted.map((u, i) => (
                      <tr key={u.name} style={{ background: i % 2 ? 'rgba(59,91,219,0.03)' : 'transparent' }}>
                        <td style={{ padding: '7px 8px', color: '#a5b4fc', fontWeight: 700, textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ padding: '7px 8px', fontWeight: 600, color: '#e0e7ef' }}>{u.name}</td>
                        <td style={{ padding: '7px 8px', textAlign: 'center', color: '#60A5FA', fontWeight: 700 }}>{u.qty}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>



          <GlassCard delay={6}>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Distribuição dos Processos Finalizados</p>
            <p style={{ fontSize: 13, color: '#f1f5f9', marginBottom: 12 }}>{donutTotal} processos finalizados</p>
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
              {donutData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.8)' }}>{item.name}</span>
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
                <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>Taxa de Etiquetas por Bancada</p>
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
                <YAxis tickFormatter={v => `${Math.round((v / labelsAll.length) * 100)}%`} tick={{ fill: 'rgba(148,163,184,0.6)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<GlassTooltip />} />
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
                  {ws.name}: {Math.round((ws.qty / labelsAll.length) * 100)}%
                </span>
              ))}
            </div>
          </GlassCard>



          <GlassCard delay={9}>
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
                {divergences.filter(d => d.status === 'resolvida').slice(0, 5).map((d: any, i: number) => (
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
          </GlassCard>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ textAlign: 'center', marginTop: 40, fontSize: 11, color: 'rgba(148,163,184,0.35)', letterSpacing: '0.05em' }}>
          Production Guard · Grupo Multilaser · Sistema de Conferencia de Materia-Prima
        </motion.p>
    </div>
  );
}
