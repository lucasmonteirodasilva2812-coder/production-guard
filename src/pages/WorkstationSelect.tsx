import React from 'react';
import { Factory } from 'lucide-react';
import { useWorkstations } from '@/hooks/useProductionData';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface Props {
  onSelected: () => void;
}

export default function WorkstationSelect({ onSelected }: Props) {
  const { data: workstations = [] } = useWorkstations();
  const setWorkstationId = useAuthStore(s => s.setWorkstationId);

  const handleSelect = (id: number) => {
    setWorkstationId(id);
    onSelected();
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="w-full max-w-md mx-4 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Factory className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Selecionar Bancada</h1>
          <p className="text-sm text-muted-foreground">Qual bancada você está operando hoje?</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {workstations.map(ws => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws.id)}
              className={cn(
                'industrial-panel p-5 text-center hover:border-primary/60 transition-all',
                ws.isOnline ? 'hover:bg-primary/5' : 'opacity-60'
              )}
            >
              <div className={cn(
                'w-3 h-3 rounded-full mx-auto mb-3',
                ws.isOnline ? 'bg-success animate-pulse-green' : 'bg-destructive'
              )} />
              <p className="font-bold">{ws.name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{ws.printerIp}</p>
              <p className={cn('text-xs mt-1', ws.isOnline ? 'text-success' : 'text-destructive')}>
                {ws.isOnline ? 'Online' : 'Offline'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
