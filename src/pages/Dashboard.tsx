export default function Dashboard() {
  // ...outros hooks e lógica...
  // Cálculo dos colaboradores em conferência
  const emConferenciaIds = partNumbers.filter(p => p.status === 'em_processo').map(p => p.id);
  const labelsEmConf = labelsAll.filter(l => emConferenciaIds.includes(l.partNumberId));
  const userMap: Record<string, { name: string, qty: number }> = {};
  labelsEmConf.forEach(l => {
    const user = l.userName || l.user_name || l.user || 'Desconhecido';
    if (!userMap[user]) userMap[user] = { name: user, qty: 0 };
    userMap[user].qty += l.quantity || 1;
  });
  const sortedUsers = Object.values(userMap).sort((a, b) => b.qty - a.qty).slice(0, 8);

  return (
    // ...código anterior...
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ color: '#93C5FD', fontWeight: 700, background: 'rgba(59,91,219,0.07)' }}>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>#</th>
          <th style={{ textAlign: 'left', padding: '6px 8px' }}>Colaborador</th>
          <th style={{ textAlign: 'center', padding: '6px 8px' }}>Itens</th>
        </tr>
      </thead>
      <tbody>
        {sortedUsers.length === 0 ? (
          <tr><td colSpan={3} style={{ textAlign: 'center', color: 'rgba(148,163,184,0.6)', padding: 18 }}>Nenhum colaborador encontrado</td></tr>
        ) : (
          sortedUsers.map((u, i) => (
            <tr key={u.name} style={{ background: i % 2 ? 'rgba(59,91,219,0.03)' : 'transparent' }}>
              <td style={{ padding: '7px 8px', color: '#a5b4fc', fontWeight: 700, textAlign: 'center' }}>{i + 1}</td>
              <td style={{ padding: '7px 8px', fontWeight: 600, color: '#e0e7ef' }}>{u.name}</td>
              <td style={{ padding: '7px 8px', textAlign: 'center', color: '#60A5FA', fontWeight: 700 }}>{u.qty}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
    // ...restante do layout...
  );
}
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
