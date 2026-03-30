import React from 'react';
import { cn } from '@/lib/utils';
import { PartNumberStatus } from '@/types/production';

const statusConfig: Record<PartNumberStatus, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-muted text-muted-foreground' },
  em_processo: { label: 'Em Processo', className: 'bg-info/15 text-info border border-info/30' },
  concluido: { label: 'Concluído', className: 'bg-success/15 text-success border border-success/30' },
  divergente: { label: 'Divergente', className: 'bg-warning/15 text-warning border border-warning/30' },
};

export function StatusBadge({ status }: { status: PartNumberStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
