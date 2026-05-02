import React, { useState } from 'react';
import { Factory, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkstations, useCreateWorkstation } from '@/hooks/useProductionData';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  onSelected: () => void;
  onBack: () => void;
}

export default function WorkstationSelect({ onSelected, onBack }: Props) {
  const { data: workstations = [], isLoading } = useWorkstations();
  const createWorkstation = useCreateWorkstation();
  const setWorkstationId = useAuthStore(s => s.setWorkstationId);

  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleSelect = (id: number) => {
    setWorkstationId(id);
    onSelected();
  };

  const handleCreate = () => {
    if (!newName.trim()) { toast.error('Informe o nome da bancada'); return; }
    createWorkstation.mutate(newName.trim(), {
      onSuccess: (ws) => {
        setWorkstationId(ws.id);
        onSelected();
      },
      onError: (e: any) => toast.error(e.message),
    });
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="industrial-panel w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Factory className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Selecionar Workflow</h1>
            <p className="text-xs text-muted-foreground">Qual workflow você está operando?</p>
          </div>
        </div>

        {/* Workstation list */}
        <div className="max-h-72 overflow-y-auto">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
          )}
          {!isLoading && workstations.length === 0 && !showCreate && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum workflow registrado ainda.
            </p>
          )}
          {workstations.map(ws => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws.id)}
              className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0 text-left"
            >
              <div className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0',
                ws.isOnline ? 'bg-success animate-pulse-green' : 'bg-muted-foreground/30'
              )} />
              <span className="flex-1 font-medium text-sm">{ws.name}</span>
              <span className={cn(
                'text-xs',
                ws.isOnline ? 'text-success' : 'text-muted-foreground'
              )}>
                {ws.isOnline ? 'Em uso' : 'Livre'}
              </span>
            </button>
          ))}
        </div>

        {/* Create new */}
        <div className="p-4 border-t border-border bg-muted/20">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar novo workflow
            </button>
          ) : (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Nome do workflow (ex: Workflow, Conferência)"
                className="flex-1"
                autoFocus
              />
              <Button
                onClick={handleCreate}
                disabled={createWorkstation.isPending}
                size="sm"
              >
                {createWorkstation.isPending ? '...' : 'Entrar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowCreate(false); setNewName(''); }}
              >
                ×
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
