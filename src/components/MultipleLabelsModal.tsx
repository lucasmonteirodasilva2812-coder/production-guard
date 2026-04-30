import React, { useState, useRef } from 'react';
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
  const [printing, setPrinting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [qrLoaded, setQrLoaded] = useState(0);

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
    setQrLoaded(0);
  };

  // Aguarda todos os QRs carregarem
  const handleQrLoad = () => setQrLoaded(q => q + 1);

  const handlePrint = () => {
    if (!containerRef.current) {
      console.error('HTML não encontrado para impressão múltipla');
      return;
    }
    const htmlContent = containerRef.current.innerHTML;
    if (!htmlContent || htmlContent.trim() === '') {
      console.error('HTML vazio, impressão abortada');
      return;
    }
    setPrinting(true);
    // Monta HTML completo
    const fullHtml = `<!DOCTYPE html><html><head><title>Imprimir Etiquetas</title>
      <link rel="stylesheet" href="/src/App.css">
      <style>
        @media print { body { margin:0!important; }
          .label-preview-print, .label-preview-print * { visibility: visible !important; }
          .label-preview-print { position: relative !important; margin: 0 auto !important; width: 420px !important; height: 210px !important; box-shadow: none !important; border: none !important; background: #fff !important; z-index: 9999 !important; page-break-after: avoid; }
        }
        @page { size: 100mm 50mm; margin: 0; }
        body { background:#fff; margin:0; padding:0; }
        .multi-labels-print { display: flex; flex-wrap: wrap; gap: 24px 0; justify-content: flex-start; align-items: flex-start; }
        .multi-labels-print > * { margin-right: 0; margin-bottom: 0; }
      </style>
    </head><body><div class="multi-labels-print">${htmlContent}</div></body></html>`;
    const printWin = window.open('', '_blank', 'width=900,height=800,toolbar=0,location=0,menubar=0,status=0,scrollbars=1,resizable=1');
    if (!printWin) {
      setPrinting(false);
      alert('Não foi possível abrir janela de impressão.');
      return;
    }
    printWin.document.open();
    printWin.document.write(fullHtml);
    printWin.document.close();
    // Aguarda carregamento dos QRs
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus();
        printWin.print();
        printWin.close();
        setPrinting(false);
      }, 400);
    };
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
          <>
            <div className="flex gap-2 mt-2 mb-2">
              <Button onClick={handlePrint} variant="primary" disabled={printing || qrLoaded < labels.length * 2}>
                {printing ? 'Imprimindo...' : 'Imprimir etiquetas'}
              </Button>
              <span className="text-xs text-muted-foreground self-center">
                {qrLoaded < labels.length * 2 ? `Aguardando QRs... (${qrLoaded}/${labels.length * 2})` : 'Pronto para imprimir'}
              </span>
            </div>
            <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto border-t pt-4 mt-2">
              {labels.map((label, idx) => (
                <div key={label.labelSeqId || idx} className="border rounded p-2 bg-white label-preview-print">
                  <LabelPreview label={label} onQrLoad={handleQrLoad} />
                  <div className="text-xs text-muted-foreground mt-1">ID: <span className="font-mono font-bold">{label.labelSeqId}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
