import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

const STEPS = [
  'Inicializando sistema...',
  'Conectando ao banco de dados...',
  'Carregando configurações...',
  'Verificando permissões...',
  'Preparando interface...',
  'Pronto.',
];

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => {
        const next = s + 1;
        setProgress(Math.round((next / STEPS.length) * 100));
        if (next >= STEPS.length) {
          clearInterval(interval);
          setTimeout(onDone, 400);
        }
        return next;
      });
    }, 320);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6 w-80">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Production Guard</h1>
            <p className="text-xs text-muted-foreground">Sistema de Controle de Etiquetagem</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center font-mono min-h-[1rem]">
            {STEPS[Math.min(step, STEPS.length - 1)]}
          </p>
        </div>

        {/* Version */}
        <p className="text-[10px] text-muted-foreground/50">v1.0.0 — grupoMultilaser</p>
      </div>
    </div>
  );
}
