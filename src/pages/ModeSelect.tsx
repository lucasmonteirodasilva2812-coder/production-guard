import React from 'react';
import { Activity, Settings, Wrench } from 'lucide-react';
import { useAuthStore, AppMode } from '@/store/authStore';

interface Props {
  onSelect: (mode: AppMode) => void;
}

export default function ModeSelect({ onSelect }: Props) {
  const setMode = useAuthStore(s => s.setMode);

  const handleSelect = (mode: AppMode) => {
    setMode(mode);
    onSelect(mode);
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 w-full max-w-xl px-4">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Production Guard</h1>
          <p className="text-muted-foreground mt-1">Como deseja utilizar o sistema?</p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => handleSelect('admin')}
            className="industrial-panel p-6 text-left hover:border-primary/60 transition-all hover:bg-primary/5 group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold mb-1">Administrador</h2>
            <p className="text-sm text-muted-foreground">
              Acesso completo: gerenciamento de usuários, importação, supervisão e configurações.
            </p>
            <p className="text-xs text-warning mt-3 font-medium">Executa o servidor local</p>
          </button>

          <button
            onClick={() => handleSelect('operador')}
            className="industrial-panel p-6 text-left hover:border-success/60 transition-all hover:bg-success/5 group"
          >
            <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center mb-4 group-hover:bg-success/25 transition-colors">
              <Wrench className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-lg font-bold mb-1">Operador</h2>
            <p className="text-sm text-muted-foreground">
              Acesso à bancada: visualizar dashboard e imprimir etiquetas.
            </p>
            <p className="text-xs text-info mt-3 font-medium">Conecta ao servidor Admin</p>
          </button>
        </div>

        <p className="text-xs text-muted-foreground/60 text-center">
          Production Guard — Sistema Industrial de Etiquetagem
        </p>
      </div>
    </div>
  );
}
