import React from 'react';
import { ClipboardList, RotateCcw, CheckSquare, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface ModuleSelectProps {
  onSelectModule: (module: 'conferencia') => void;
  onLogout: () => void;
}

export default function ModuleSelect({ onSelectModule, onLogout }: ModuleSelectProps) {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">M</div>
          <span className="text-xl font-black text-foreground">
            <span className="font-normal text-muted-foreground">grupo</span>Multilaser
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Olá, <span className="font-semibold text-foreground">{user?.name}</span>. Selecione o módulo:
        </p>
      </div>

      {/* Módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl">

        {/* Inventário — em breve */}
        <button
          disabled
          className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted bg-muted/30 p-8 opacity-50 cursor-not-allowed select-none"
        >
          <ClipboardList size={40} className="text-muted-foreground" />
          <div className="text-center">
            <div className="text-base font-bold text-foreground">Inventário</div>
            <div className="text-xs text-muted-foreground mt-1">Em breve</div>
          </div>
        </button>

        {/* Conferência — ativo */}
        <button
          onClick={() => onSelectModule('conferencia')}
          className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-primary bg-primary/5 p-8 hover:bg-primary/10 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <CheckSquare size={40} className="text-primary" />
          <div className="text-center">
            <div className="text-base font-bold text-foreground">Conferência</div>
            <div className="text-xs text-muted-foreground mt-1">Impressão de etiquetas</div>
          </div>
        </button>

        {/* Devolução — em breve */}
        <button
          disabled
          className="relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted bg-muted/30 p-8 opacity-50 cursor-not-allowed select-none"
        >
          <RotateCcw size={40} className="text-muted-foreground" />
          <div className="text-center">
            <div className="text-base font-bold text-foreground">Devolução</div>
            <div className="text-xs text-muted-foreground mt-1">Em breve</div>
          </div>
        </button>

      </div>

      {/* Sair */}
      <button
        onClick={onLogout}
        className="mt-10 flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
      >
        <LogOut size={15} />
        Sair
      </button>
    </div>
  );
}
