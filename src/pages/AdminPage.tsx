import React, { useState } from 'react';
import { useProductionStore } from '@/store/productionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Monitor, Wifi, WifiOff, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { workstations, updateWorkstationConfig, currentWorkstation, setCurrentWorkstation } = useProductionStore();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editIp, setEditIp] = useState('');
  const [editPort, setEditPort] = useState('');

  const startEdit = (id: number) => {
    const ws = workstations.find(w => w.id === id);
    if (ws) {
      setEditingId(id);
      setEditIp(ws.printerIp);
      setEditPort(String(ws.printerPort));
    }
  };

  const saveEdit = () => {
    if (editingId === null) return;
    updateWorkstationConfig(editingId, {
      printerIp: editIp,
      printerPort: parseInt(editPort) || 9100,
    });
    toast.success(`Bancada ${editingId} atualizada`);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Administração</h1>
        <p className="text-sm text-muted-foreground">Configuração de impressoras e sistema</p>
      </div>

      {/* Current Workstation Selector */}
      <div className="industrial-panel p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          Bancada Atual (este computador)
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {workstations.map(ws => (
            <button
              key={ws.id}
              onClick={() => {
                setCurrentWorkstation(ws.id);
                toast.success(`Agora operando como ${ws.name}`);
              }}
              className={cn(
                "p-3 rounded-lg border text-center transition-colors",
                currentWorkstation === ws.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <p className="text-sm font-medium">{ws.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Workstation Config */}
      <div className="industrial-panel p-4">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Configuração de Impressoras Zebra
        </h2>
        <div className="space-y-3">
          {workstations.map(ws => (
            <div key={ws.id} className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{ws.name}</span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    ws.isOnline ? "text-success" : "text-destructive"
                  )}>
                    {ws.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {ws.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateWorkstationConfig(ws.id, { isOnline: !ws.isOnline })}
                  >
                    {ws.isOnline ? 'Desativar' : 'Ativar'}
                  </Button>
                  {editingId !== ws.id && (
                    <Button variant="outline" size="sm" onClick={() => startEdit(ws.id)}>
                      Editar
                    </Button>
                  )}
                </div>
              </div>

              {editingId === ws.id ? (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">IP da Impressora</label>
                    <Input value={editIp} onChange={e => setEditIp(e.target.value)} className="font-mono mt-1" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-muted-foreground">Porta</label>
                    <Input value={editPort} onChange={e => setEditPort(e.target.value)} className="font-mono mt-1" />
                  </div>
                  <Button onClick={saveEdit} size="sm" className="gap-1">
                    <Save className="w-3 h-3" />
                    Salvar
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-mono">{ws.printerIp}:{ws.printerPort}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ZPL Template Info */}
      <div className="industrial-panel p-4">
        <h2 className="text-sm font-semibold mb-2">Template ZPL</h2>
        <pre className="text-xs font-mono bg-background p-3 rounded-lg overflow-x-auto text-muted-foreground">
{`^XA
^FO50,50^A0N,40,40^FD{partNumber}^FS
^FO50,100^A0N,30,30^FD{description}^FS
^FO50,150^A0N,25,25^FDID: {compositeId}^FS
^FO50,200^BQN,2,6^FDQA,{compositeId}|{partNumber}^FS
^XZ`}
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          Com o backend ativado, será possível editar o template ZPL dinamicamente.
        </p>
      </div>
    </div>
  );
}
