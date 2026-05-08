import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadialBarChart, RadialBar, Cell,
} from 'recharts';
import { useShipments, usePartNumbers, useLabels, useDivergences, useWorkstations } from '@/hooks/useProductionData';
import { useAuthStore } from '@/store/authStore';
import { Package, Printer, AlertTriangle, CheckCircle, FileText, Activity, TrendingUp } from 'lucide-react';

const C1 = '#38bdf8';
const C2 = '#0ea5e9';
const C3 = '#7dd3fc';
const C4 = '#0284c7';
const CARD = 'rgba(15,32,64,0.85)';
const BORDER = '#1e3a5f';

function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a1e3c', border: '1px solid #1e3a5f', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#e0f2fe' }}>
      <div style={{ color: '#94a3b8', marginBottom: 2 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>{p.value}</div>
      ))}
    </div>
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

  // Labels por dia (Ãºltimos 7 dias)
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

  // Labels por bancada
  const labelsPerWs = useMemo(() => {
    return workstations.map(ws => ({
      name: ws.name.replace('Bancada ', 'B'),
      qty: labelsAll.filter((l: any) => l.workstationId === ws.id).length,
      online: ws.isOnline,
    }));
  }, [workstations, labelsAll]);

  // Status dos PNs para radial
  const radialData = [
    { name: 'ConcluÃ­do', value: completionRate, fill: '#22d3ee' },
  ];

  // PNs por status para barras de progresso
  const statusData = [
    { label: 'ConcluÃ­dos', value: pnConcluido, total: totalPn, color: '#22d3ee' },
    { label: 'Em Processo', value: pnEmProcesso, total: totalPn, color: '#38bdf8' },
    { label: 'Pendentes', value: pnPendente, total: totalPn, color: '#0ea5e9' },
    { label: 'DivergÃªncias', value: divergences.length, total: Math.max(totalPn, divergences.length, 1), color: '#f59e0b' },
  ];

  const stats = isOperator ? [
    { label: 'Etiquetas', value: labels.length, icon: Printer, color: C1 },
    { label: 'ConcluÃ­dos', value: pnConcluido, icon: CheckCircle, color: '#22d3ee' },
    { label: 'Em Processo', value: pnEmProcesso, icon: Activity, color: C3 },
    { label: 'DivergÃªncias', value: divergences.length, icon: AlertTriangle, color: '#f59e0b' },
  ] : [
    { label: 'Remessas', value: shipments.length, icon: FileText, color: C3 },
    { label: 'Etiquetas', value: labels.length, icon: Printer, color: C1 },
    { label: 'ConcluÃ­dos', value: pnConcluido, icon: CheckCircle, color: '#22d3ee' },
    { label: 'DivergÃªncias', value: divergences.length, icon: AlertTriangle, color: '#f59e0b' },
  ];

  const currentWS = workstations.find(w => w.id === workstationId);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060f1e 0%, #0a1628 60%, #0c1f3a 100%)', padding: '24px', color: '#e0f2fe' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            MÃ³dulo ConferÃªncia
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e0f2fe', margin: 0 }}>
            Dashboard{isOperator ? ` â€” Bancada ${workstationId}` : ''}
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {isOperator ? currentWS?.name : 'VisÃ£o geral da linha de produÃ§Ã£o'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '6px 14px' }}>
          <TrendingUp size={14} color={C1} />
          <span style={{ fontSize: 12, color: C1, fontWeight: 600 }}>
            {completionRate}% concluÃ­do
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}88, transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={15} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f0f9ff', fontFamily: 'monospace', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Linha do meio: grÃ¡fico de Ã¡rea grande + lateral direita */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>

        {/* Ãrea grande â€” etiquetas por dia */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Etiquetas impressas</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f9ff' }}>{labels.length} <span style={{ fontSize: 11, color: C1, fontWeight: 600 }}>Ãºltimos 7 dias</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={labelsPerDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C1} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={C1} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<MiniTooltip />} />
              <Area type="monotone" dataKey="qty" stroke={C1} strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: C1, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: C1 }} name="Etiquetas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lateral direita: bancadas */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Etiquetas por bancada</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f9ff', marginBottom: 14 }}>{labelsAll.length} total</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={labelsPerWs} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={true} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<MiniTooltip />} />
              <Bar dataKey="qty" radius={[4, 4, 0, 0]} name="Etiquetas">
                {labelsPerWs.map((entry, i) => (
                  <Cell key={i} fill={entry.online ? C2 : '#1e3a5f'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linha inferior: radial + progresso PNs + bancadas status + linha etiquetas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>

        {/* Taxa de conclusÃ£o */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, alignSelf: 'flex-start' }}>ConclusÃ£o</div>
          <div style={{ position: 'relative', width: 110, height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270} barSize={10}>
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#1e3a5f' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#f0f9ff' }}>{completionRate}%</span>
              <span style={{ fontSize: 9, color: '#64748b' }}>concluÃ­do</span>
            </div>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 10 }}>
            <span style={{ color: '#22d3ee' }}>{pnConcluido} OK</span>
            <span style={{ color: '#64748b' }}>{totalPn} total</span>
          </div>
        </div>

        {/* Progresso por status */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Status PNs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statusData.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.value}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: '#1e3a5f', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${s.color}, ${s.color}88)`, width: `${Math.round((s.value / s.total) * 100)}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bancadas online/offline */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Bancadas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(isOperator ? workstations.filter(w => w.id === workstationId) : workstations).map(ws => (
              <div key={ws.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: ws.isOnline ? 'rgba(34,211,238,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${ws.isOnline ? '#22d3ee33' : '#1e3a5f'}` }}>
                <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>{ws.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: ws.isOnline ? '#22d3ee' : '#475569', boxShadow: ws.isOnline ? '0 0 6px #22d3ee' : 'none' }} />
                  <span style={{ fontSize: 10, color: ws.isOnline ? '#22d3ee' : '#475569' }}>{ws.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini line chart â€” evoluÃ§Ã£o cumulativa */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>EvoluÃ§Ã£o semanal</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f9ff', marginBottom: 8 }}>
            {labelsPerDay.reduce((a, b) => a + b.qty, 0)} <span style={{ fontSize: 10, color: C3, fontWeight: 500 }}>7 dias</span>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={labelsPerDay} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
              <defs>
                <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C4} />
                  <stop offset="100%" stopColor={C1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<MiniTooltip />} />
              <Line type="monotone" dataKey="qty" stroke="url(#lineGlow)" strokeWidth={2.5} dot={false} name="Etiquetas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
