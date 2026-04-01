import React, { useState } from 'react';
import { useProductionStore } from '@/store/productionStore';
import { useLabels, useDivergences, useDeleteLabel, useReprintLabel, useWorkstations } from '@/hooks/useProductionData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, RotateCcw, Trash2, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Supervisor() {
  const { currentWorkstation } = useProductionStore();
  const { data: labels = [] } = useLabels();
  const { data: divergences = [] } = useDivergences();
  const { data: workstations = [] } = useWorkstations();
  const deleteLabel = useDeleteLabel();
  const reprintLabel = useReprintLabel();
  const [searchId, setSearchId] = useState('');

  const filteredLabels = searchId
    ? labels.filter(l =>
        l.compositeId.includes(searchId) || l.partNumber.toLowerCase().includes(searchId.toLowerCase())
      )
    : [...labels].sort((a, b) => b.printedAt.localeCompare(a.printedAt)).slice(0, 50);

  const currentWS = workstations.find(w => w.id === currentWorkstation);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supervisor</h1>
        <p className="text-sm text-muted-foreground">Gestão avançada e controle de divergências</p>
      </div>

      {/* Divergences */}
      {divergences.length > 0 && (
        <div className="industrial-panel p-4 border-warning/30">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            Divergências ({divergences.length})
          </h2>
          <div className="space-y-2">
            {divergences.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div>
                  <span className="font-mono text-sm font-medium">{d.partNumber}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Remessa: {d.declaredQty.toLocaleString('pt-BR')} · Físico: {d.labeledQty.toLocaleString('pt-BR')} ·
                    <span className={d.type === 'falta' ? ' text-destructive' : ' text-warning'}>
                      {' '}{d.type === 'falta' ? '-' : '+'}{Math.abs(d.difference).toLocaleString('pt-BR')} ({d.type})
                    </span>
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Label Search & Management */}
      <div className="industrial-panel p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Histórico de Etiquetas
        </h2>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="Buscar por ID ou Part Number..."
              className="pl-9 font-mono"
            />
          </div>
        </div>

        {filteredLabels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs text-muted-foreground font-medium">ID Composto</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium">Part Number</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-right">Qtd</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium">Bancada</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium">Impresso por</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium">Data/Hora</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLabels.map(label => (
                  <tr key={label.id} className="hover:bg-muted/30">
                    <td className="py-2 font-mono text-xs">{label.compositeId}</td>
                    <td className="py-2 font-mono">{label.partNumber}</td>
                    <td className="py-2 text-right font-mono">{label.quantity?.toLocaleString('pt-BR')}</td>
                    <td className="py-2">Bancada {label.workstationId}</td>
                    <td className="py-2 text-muted-foreground">{label.printedBy}</td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {new Date(label.printedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            reprintLabel.mutate({ id: label.id, printerIp: currentWS?.printerIp || '' });
                            toast.info(`Reimpressão: ${label.compositeId}`);
                          }}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Reimprimir"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            deleteLabel.mutate(label.id, {
                              onSuccess: () => toast.info('Etiqueta removida e saldo estornado'),
                              onError: (e: any) => toast.error(e.message),
                            });
                          }}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="Deletar (estorno)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma etiqueta encontrada</p>
        )}
      </div>
    </div>
  );
}
