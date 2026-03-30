import React from 'react';
import { useProductionStore } from '@/store/productionStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Package, Printer, AlertTriangle, CheckCircle, FileText, Activity } from 'lucide-react';

export default function Dashboard() {
  const { shipments, partNumbers, labels, printJobs, divergences, workstations } = useProductionStore();

  const stats = [
    {
      label: 'Remessas',
      value: shipments.length,
      icon: FileText,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: 'Etiquetas Impressas',
      value: labels.length,
      icon: Printer,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Concluídos',
      value: partNumbers.filter(p => p.status === 'concluido').length,
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Divergências',
      value: divergences.length,
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da linha de produção</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="industrial-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold font-mono">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Workstation status */}
      <div className="industrial-panel p-4">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Status das Bancadas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {workstations.map(ws => (
            <div key={ws.id} className={`p-3 rounded-lg border ${ws.isOnline ? 'border-success/30 glow-green' : 'border-destructive/30'} bg-background/50`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{ws.name}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${ws.isOnline ? 'bg-success animate-pulse-green' : 'bg-destructive'}`} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">{ws.printerIp}</p>
              <p className={`text-xs mt-1 ${ws.isOnline ? 'text-success' : 'text-destructive'}`}>
                {ws.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Part Numbers Table */}
      {partNumbers.length > 0 && (
        <div className="industrial-panel p-4">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Part Numbers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs text-muted-foreground font-medium">Part Number</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium">Descrição</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-right">Declarado</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-right">Etiquetado</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-center">Progresso</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {partNumbers.map(pn => {
                  const progress = pn.declaredQty > 0 ? Math.round((pn.labeledQty / pn.declaredQty) * 100) : 0;
                  return (
                    <tr key={pn.id} className="hover:bg-muted/30">
                      <td className="py-2 font-mono font-medium">{pn.partNumber}</td>
                      <td className="py-2 text-muted-foreground">{pn.description}</td>
                      <td className="py-2 text-right font-mono">{pn.declaredQty.toLocaleString()}</td>
                      <td className="py-2 text-right font-mono">{pn.labeledQty.toLocaleString()}</td>
                      <td className="py-2">
                        <div className="w-full bg-muted rounded-full h-1.5 mx-auto max-w-[100px]">
                          <div
                            className="h-1.5 rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2 text-center"><StatusBadge status={pn.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {partNumbers.length === 0 && (
        <div className="industrial-panel p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma remessa importada ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Vá para "Importar" para carregar uma planilha.</p>
        </div>
      )}
    </div>
  );
}
