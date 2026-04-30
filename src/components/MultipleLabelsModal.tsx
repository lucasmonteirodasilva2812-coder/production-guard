import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import LabelPreview from './LabelPreview';

interface MultipleLabelsModalProps {
  open: boolean;
  onClose: () => void;
  baseLabel: any;
}

function generateUniqueId(base: string, idx: number) {
  // YYMMDDHHMMSS + idx
  const now = new Date();
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  const ts = `${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return ts + pad(idx, 2);
}

export default function MultipleLabelsModal({ open, onClose, baseLabel }: MultipleLabelsModalProps) {
  const [qty, setQty] = useState(1);
  const [labels, setLabels] = useState<any[]>([]);
  const [rendered, setRendered] = useState(false);

  const handleGenerate = () => {
    if (qty < 1) return;
    const now = new Date();
    const generated = Array.from({ length: qty }, (_, i) => ({
      ...baseLabel,
      labelSeqId: generateUniqueId('label', i),
      printedAt: now.toISOString(),
    }));
    setLabels(generated);
    setRendered(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Impressão Múltipla de Etiquetas</DialogTitle>
        </DialogHeader>
        <div className="flex items-end gap-4 mb-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quantidade de etiquetas *</label>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              autoFocus
            />
          </div>
          <Button onClick={handleGenerate} variant="primary">Gerar etiquetas</Button>
          <Button onClick={onClose} variant="ghost">Fechar</Button>
        </div>
        {rendered && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto border-t pt-4 mt-2">
            {labels.map((label, idx) => (
              <div key={label.labelSeqId || idx} className="border rounded p-2 bg-white">
                <LabelPreview label={label} />
                <div className="text-xs text-muted-foreground mt-1">ID: <span className="font-mono font-bold">{label.labelSeqId}</span></div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
