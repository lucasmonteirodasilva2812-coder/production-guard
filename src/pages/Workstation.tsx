import React, { useState, useCallback, useEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import { useAuthStore } from '@/store/authStore';
import { useWorkstationNavStore } from '@/store/workstationNavStore';
import {
  useShipments, usePartNumbers, useLabels, useReservations, useWorkstations,
  useCreateReservation, useCreateLabel, useReprintLabel, useWorkstationActiveUsers,
} from '@/hooks/useProductionData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import LabelPreview, { LabelData } from '@/components/LabelPreview';
import { Printer, RotateCcw, QrCode, ChevronLeft, Package2, Box, Search, ChevronsDown, ChevronsUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Label } from '@/types/production';

// ── Função utilitária para abrir popup de impressão ────────────────────────
function openLabelPrintPopup(label: any, onAfterPrint?: () => void) {
  const w = 440, h = 240;
  const printWin = window.open('', '_blank', `width=${w},height=${h},left=200,top=200,toolbar=0,location=0,menubar=0,status=0,scrollbars=0,resizable=0`);
  if (!printWin) return;

  const html = renderToString(<LabelPreview label={label} />);
  if (!html || html.trim() === '') {
    alert('ERRO: HTML da etiqueta está vazio!');
    return;
  }
  const doc = printWin.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>Imprimir Etiqueta</title>
    <style>
      @media print { body { margin:0!important; } }
      @page { size: 100mm 50mm; margin: 0; }
      body { background:#fff; margin:0; padding:0; }
    </style>
  </head><body><div id="label-print-root">${html}</div></body></html>`);
  doc.close();

  printWin.onload = () => {
    setTimeout(() => {
      printWin.focus();
      printWin.print();
      printWin.close();
      if (onAfterPrint) onAfterPrint();
    }, 200);
  };
}

// ── Workstation tabs ───────────────────────────────────────────────────────
type TabType = 'normal' | 'caixa';

export default function Workstation() {
  const user = useAuthStore(s => s.user);
  const workstationId = useAuthStore(s => s.workstationId) || 1;

  const { data: shipments = [] } = useShipments();
  const { data: partNumbers = [] } = usePartNumbers();
  const { data: labels = [] } = useLabels();
  const { data: reservations = [] } = useReservations();
  const { data: workstations = [] } = useWorkstations();
  const { data: activeUsers = [] } = useWorkstationActiveUsers(workstationId);
  const createReservation = useCreateReservation();
  const createLabel = useCreateLabel();
  const reprintLabel = useReprintLabel();

  // Persisted navigation state
  const selectedShipment = useWorkstationNavStore(s => s.selectedShipment);
  const setSelectedShipment = useWorkstationNavStore(s => s.setSelectedShipment);
  const activeTab = useWorkstationNavStore(s => s.activeTab);
  const setActiveTab = useWorkstationNavStore(s => s.setActiveTab);
  const selectedPN = useWorkstationNavStore(s => s.selectedPN);
  const setSelectedPN = useWorkstationNavStore(s => s.setSelectedPN);
  const resetNav = useWorkstationNavStore(s => s.reset);
  const [shipmentSearch, setShipmentSearch] = useState('');
  const topRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);

  // Form state (normal label)
  const [pnInput, setPnInput] = useState('');
  const [printQty, setPrintQty] = useState('');
  const [msl, setMsl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [lastLabel, setLastLabel] = useState<Label | null>(null);

  // Form state (box label)
  const [boxPn, setBoxPn] = useState('');
  const [boxQty, setBoxQty] = useState('');
  const [lastBoxLabel, setLastBoxLabel] = useState<LabelData | null>(null);

  const currentWS = workstations.find(w => w.id === workstationId);
  const selectedShipmentData = shipments.find(s => s.id === selectedShipment);
  const shipmentPNs = partNumbers.filter(pn => pn.shipmentId === selectedShipment);
  const selected = partNumbers.find(p => p.id === selectedPN);
  const reserved = selectedPN
    ? reservations.filter(r => r.partNumberId === selectedPN && r.status === 'pendente').reduce((s, r) => s + r.quantity, 0)
    : 0;
  const available = selected ? selected.declaredQty - selected.labeledQty - reserved : 0;

  const recentLabels = labels
    .filter(l => l.workstationId === workstationId)
    .sort((a, b) => b.printedAt.localeCompare(a.printedAt))
    .slice(0, 30);

  // Mini dashboard stats
  const shipmentName = selectedShipmentData?.fileName?.replace(/\.[^/.]+$/, '') || '';
  const totalItems = shipmentPNs.length;
  const conferidos = shipmentPNs.filter(pn => pn.status === 'concluido' || pn.status === 'divergente').length;
  const sobras = shipmentPNs.filter(pn => pn.labeledQty > pn.declaredQty).length;
  const faltas = shipmentPNs.filter(pn => pn.labeledQty < pn.declaredQty && pn.labeledQty > 0).length;

  // Select PN by clicking table row or typing in input
  const selectPnById = useCallback((id: string) => {
    const pn = partNumbers.find(p => p.id === id);
    if (pn) { setSelectedPN(id); setPnInput(pn.partNumber); }
  }, [partNumbers, setSelectedPN]);

  const handlePnInputChange = (val: string) => {
    setPnInput(val);
    const match = partNumbers.find(p => p.partNumber.toLowerCase() === val.toLowerCase());
    if (match) setSelectedPN(match.id);
    else setSelectedPN(null);
  };

  // Sincronizar pnInput ao restaurar selectedPN
  useEffect(() => {
    if (selectedPN) {
      const pn = partNumbers.find(p => p.id === selectedPN);
      if (pn) setPnInput(pn.partNumber);
    }
  }, [selectedPN, partNumbers]);

  // ── Normal label print ────────────────────────────────────────────────────
  const handlePrint = (mslOverride?: string, descOverride?: string | null) => {
    if (!selectedPN || !selected) { toast.error('Selecione um Part Number'); return; }
    const qty = parseInt(printQty);
    if (isNaN(qty) || qty <= 0) { toast.error('Quantidade inválida'); return; }
    const excess = qty - available;
    const mslVal = mslOverride !== undefined ? mslOverride : msl;
    createReservation.mutate(
      { partNumberId: selectedPN, workstationId, quantity: qty },
      {
        onSuccess: (reservation) => {
          createLabel.mutate(
            {
              partNumberId: selectedPN, reservationId: reservation.id,
              workstationId, printedBy: user?.name || 'Operador',
              msl: mslVal || undefined, expiryDate: expiryDate || undefined, labelType: 'normal',
              description: descOverride || undefined,
            },
            {
              onSuccess: (label) => {
                setLastLabel(label);
                if (excess > 0) {
                  toast.warning(`Sobra registrada: +${excess.toLocaleString('pt-BR')} un`, { description: `${selected.partNumber}` });
                } else {
                  toast.success(`Etiqueta gerada!`, { description: `${selected.partNumber} — ${qty.toLocaleString('pt-BR')} un` });
                }
                openLabelPrintPopup({ ...label, shipmentName }, () => {
                  const pnInputEl = document.getElementById('pn-input');
                  if (pnInputEl) (pnInputEl as HTMLInputElement).focus();
                });
              },
              onError: (e: any) => toast.error(`Erro ao gerar etiqueta: ${e.message}`),
            }
          );
        },
        onError: (e: any) => toast.error(`Erro ao criar reserva: ${e.message}`),
      }
    );
  };

  const handleLookupAndPrint = async () => {
    let mslVal: string | undefined;
    let descVal: string | null = null;
    if (pnInput) {
      try {
        const { api } = await import('@/lib/api');
        const base = await api.lookupPnBase(pnInput);
        if (base.msl) { mslVal = base.msl; setMsl(base.msl); }
        if (base.description) descVal = base.description;
      } catch {
        // PN não cadastrado na base — prossegue com dados da remessa
      }
    }
    handlePrint(mslVal, descVal);
  };

  // ── Box label print (web) ────────────────────────────────────────────────
  const handleBoxPrint = async () => {
    if (!boxPn.trim()) { toast.error('Informe o Part Number'); return; }
    const qty = parseInt(boxQty);
    if (isNaN(qty) || qty <= 0) { toast.error('Quantidade inválida'); return; }

    let descVal = '';
    try {
      const { api } = await import('@/lib/api');
      const base = await api.lookupPnBase(boxPn.trim());
      if (base.description) descVal = base.description;
    } catch {
      // PN não cadastrado na base — prossegue sem descrição
    }

    const now = new Date().toISOString();
    const boxLabel: LabelData = {
      partNumber: boxPn.trim(),
      description: descVal,
      quantity: qty,
      printedBy: user?.name || 'Operador',
      printedAt: now,
      msl: null,
      labelType: 'caixa',
    };
    setLastBoxLabel(boxLabel);
    openLabelPrintPopup(boxLabel);
    toast.success('Etiqueta de caixa pronta para impressão');
  };

  // ── Remessa selection ─────────────────────────────────────────────────────
  if (!selectedShipment) {
    const filteredShipments = shipments.filter(s =>
      s.fileName.toLowerCase().includes(shipmentSearch.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Workflow {workstationId}</h1>
          <p className="text-sm text-muted-foreground">Selecione um workflow para começar</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={shipmentSearch}
            onChange={e => setShipmentSearch(e.target.value)}
            placeholder="Buscar remessa..."
            className="pl-9"
          />
        </div>

        <div className="industrial-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-3 text-xs text-muted-foreground font-medium text-left">Nome / Código</th>
                <th className="p-3 text-xs text-muted-foreground font-medium text-right">Part Numbers</th>
                <th className="p-3 text-xs text-muted-foreground font-medium text-right">Total un</th>
                <th className="p-3 text-xs text-muted-foreground font-medium text-left">Data</th>
                <th className="p-3 text-xs text-muted-foreground font-medium text-left">Importado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredShipments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    {shipments.length === 0 ? (
                      <div>
                        <Package2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma remessa disponível. Importe primeiro.</p>
                      </div>
                    ) : (
                      <p className="text-sm">Nenhuma remessa encontrada para "{shipmentSearch}"</p>
                    )}
                  </td>
                </tr>
              )}
              {filteredShipments.map(s => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedShipment(s.id)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3 font-mono font-semibold">{s.fileName}</td>
                  <td className="p-3 text-right font-mono">{s.totalParts}</td>
                  <td className="p-3 text-right font-mono">{s.totalQuantity.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-muted-foreground">{new Date(s.importedAt).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3 text-muted-foreground">{s.importedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Main work view ────────────────────────────────────────────────────────
  return (
    <div ref={topRef} className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => { setSelectedShipment(null); setSelectedPN(null); setPnInput(''); resetNav(); }}
          className="text-muted-foreground hover:text-foreground mt-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black truncate">{shipmentName}</h1>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                TOTAL: {totalItems}
              </span>
              <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-medium">
                CONF: {conferidos}
              </span>
              {sobras > 0 && (
                <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded-full font-medium">
                  SOBRAS: {sobras}
                </span>
              )}
            </div>
          </div>
          {activeUsers.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Usuários atuando: {activeUsers.join(', ')}
            </p>
          )}
        </div>
        {/* Tabs */}
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setActiveTab('normal')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', activeTab === 'normal' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            <Printer className="w-3.5 h-3.5 inline mr-1.5" />Etiqueta
          </button>
          <button onClick={() => setActiveTab('caixa')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', activeTab === 'caixa' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            <Box className="w-3.5 h-3.5 inline mr-1.5" />Caixa
          </button>
          {recentLabels.length > 0 && (
            <button
              onClick={() => labelsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Ir para reimpressões"
            >
              <ChevronsDown className="w-3.5 h-3.5 inline mr-1" />Reimpressões
            </button>
          )}
        </div>
      </div>

      {/* ── Normal label form ── */}
      {activeTab === 'normal' && (
        <div className="industrial-panel p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: form fields */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Gerar Etiqueta de Produto</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Part Number *</label>
                  <Input
                    id="pn-input"
                    value={pnInput}
                    onChange={e => handlePnInputChange(e.target.value)}
                    placeholder="Ex: CPRE005A"
                    className={cn('font-mono', selectedPN && 'border-success/50 bg-success/5')}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const qtyInput = document.getElementById('qty-input');
                        if (qtyInput) (qtyInput as HTMLInputElement).focus();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade do Lote *</label>
                  <Input
                    id="qty-input"
                    type="number"
                    min={1}
                    value={printQty}
                    onChange={e => setPrintQty(e.target.value)}
                    placeholder="Ex: 1000"
                    className="font-mono"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLookupAndPrint();
                        setPrintQty('');
                        const pnInputEl = document.getElementById('pn-input');
                        if (pnInputEl) (pnInputEl as HTMLInputElement).focus();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data de Validade <span className="text-muted-foreground/50">(opcional)</span></label>
                  <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                </div>
              </div>

              {selected && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-muted/50 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">Remessa</p>
                    <p className="text-lg font-mono font-bold">{selected.declaredQty.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-destructive/5 p-2 rounded text-center border border-destructive/20">
                    <p className="text-[10px] text-destructive uppercase">Pendente</p>
                    <p className="text-lg font-mono font-bold text-destructive">{available.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-success/5 p-2 rounded text-center border border-success/20">
                    <p className="text-[10px] text-success uppercase">Conferido</p>
                    <p className="text-lg font-mono font-bold text-success">{selected.labeledQty.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              )}


              <div className="flex gap-2">
                <Button onClick={() => handleLookupAndPrint()} disabled={createLabel.isPending || createReservation.isPending}>
                  <Printer className="w-4 h-4 mr-1" />Imprimir
                </Button>
              </div>

            </div>

            {/* Right: label preview */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground self-start">Pré-visualização</p>
              {lastLabel ? (
                <>
                  <div className="w-full flex flex-col items-center">
                    <div style={{ width: '150mm', height: '75mm', overflow: 'hidden', position: 'relative', margin: '0 auto' }}>
                      <div style={{ transform: 'scale(1.5)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                        <LabelPreview label={{
                          labelSeqId: lastLabel.labelSeqId,
                      compositeId: lastLabel.compositeId,
                      partNumber: lastLabel.partNumber,
                      description: lastLabel.description,
                      quantity: lastLabel.quantity,
                      printedBy: lastLabel.printedBy,
                      printedAt: lastLabel.printedAt,
                      msl: lastLabel.msl,
                      expiryDate: lastLabel.expiryDate,
                          qrValidated: lastLabel.qrValidated,
                          shipmentName,
                        }} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg w-full flex items-center justify-center" style={{ height: 160 }}>
                  <p className="text-xs text-muted-foreground">A etiqueta aparecerá aqui após impressão</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Box label form ── */}
      {activeTab === 'caixa' && (
        <div className="industrial-panel p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Gerar Etiqueta de Caixa</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Part Number *</label>
                  <Input
                    id="box-pn-input"
                    value={boxPn}
                    onChange={e => setBoxPn(e.target.value)}
                    placeholder="Ex: CPRE005A"
                    className="font-mono"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('box-qty-input')?.focus();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade *</label>
                  <Input
                    id="box-qty-input"
                    type="number"
                    min={1}
                    value={boxQty}
                    onChange={e => setBoxQty(e.target.value)}
                    placeholder="Ex: 10000"
                    className="font-mono"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBoxPrint();
                        setBoxQty('');
                        document.getElementById('box-pn-input')?.focus();
                      }
                    }}
                  />
                </div>
              </div>
              <Button onClick={handleBoxPrint} className="gap-2">
                <Box className="w-4 h-4" />Imprimir Etiqueta de Caixa
              </Button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground self-start">Pré-visualização</p>
              {lastBoxLabel ? (
                <div style={{ width: '150mm', height: '75mm', overflow: 'hidden', position: 'relative', margin: '0 auto' }}>
                  <div style={{ transform: 'scale(1.5)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                    <LabelPreview label={lastBoxLabel} />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg w-full flex items-center justify-center" style={{ height: 160 }}>
                  <p className="text-xs text-muted-foreground">A etiqueta aparecerá aqui após impressão</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Part Number table ── */}
      {activeTab === 'normal' && (
        <div className="industrial-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-3 text-xs text-muted-foreground font-medium text-left">Part Number</th>
                  <th className="p-3 text-xs text-muted-foreground font-medium text-left">Descrição</th>
                  <th className="p-3 text-xs text-muted-foreground font-medium text-right">Remessa</th>
                  <th className="p-3 text-xs text-muted-foreground font-medium text-right">Físico</th>
                  <th className="p-3 text-xs text-muted-foreground font-medium text-right">Diferença</th>
                  <th className="p-3 text-xs text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shipmentPNs.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">Nenhum Part Number nesta remessa</td></tr>
                )}
                {shipmentPNs.map(pn => {
                  const diff = pn.labeledQty - pn.declaredQty;
                  const pct = pn.declaredQty > 0 ? Math.min((pn.labeledQty / pn.declaredQty) * 100, 100) : 0;
                  return (
                    <tr key={pn.id}
                      onClick={() => selectPnById(pn.id)}
                      className={cn('cursor-pointer hover:bg-muted/30 transition-colors', selectedPN === pn.id && 'bg-primary/5 border-l-2 border-l-primary')}>
                      <td className="p-3 font-mono font-semibold">{pn.partNumber}</td>
                      <td className="p-3 text-muted-foreground max-w-[200px] truncate">{pn.description}</td>
                      <td className="p-3 text-right font-mono">{pn.declaredQty.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right">
                        <span className="font-mono">{pn.labeledQty.toLocaleString('pt-BR')}</span>
                        <div className="w-full bg-muted rounded-full h-1 mt-1.5 min-w-[60px]">
                          <div className="h-1 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className={cn('p-3 text-right font-mono font-semibold', diff < 0 ? 'text-destructive' : diff === 0 ? 'text-success' : 'text-warning')}>
                        {diff > 0 ? '+' : ''}{diff.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3"><StatusBadge status={pn.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Labels list + preview ── */}
      {activeTab === 'normal' && recentLabels.length > 0 && (
        <div ref={labelsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 industrial-panel p-4">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Etiquetas Geradas — Workflow {workstationId}</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {recentLabels.map(label => (
                <div key={label.id}
                  onClick={() => setLastLabel(label)}
                  className={cn('flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-muted/30 text-xs', lastLabel?.id === label.id && 'bg-primary/5')}>
                  <span className="font-mono w-28 shrink-0 text-foreground">{label.labelSeqId || label.compositeId}</span>
                  <span className="font-mono flex-1 truncate text-muted-foreground">{label.partNumber}</span>
                  <span className="font-mono shrink-0">{label.quantity?.toLocaleString('pt-BR')} un</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {label.qrValidated && <QrCode className="w-3 h-3 text-success" />}
                    <button onClick={e => {
                        e.stopPropagation();
                        setLastLabel(label);
                        openLabelPrintPopup({ ...label, shipmentName });
                        reprintLabel.mutate({ id: label.id, printerIp: '' });
                        toast.info(`Reimprimindo: ${label.labelSeqId || label.compositeId}`);
                      }}
                      className="text-muted-foreground hover:text-foreground" title="Reimprimir">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="industrial-panel p-4 flex flex-col items-center overflow-auto">
            <div className="flex items-center justify-between w-full mb-3">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Última Etiqueta</h3>
              <button
                onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md bg-muted/50 hover:bg-muted"
                title="Voltar ao topo"
              >
                <ChevronsUp className="w-3.5 h-3.5" />Topo
              </button>
            </div>
            {lastLabel ? (
              <div style={{ width: '150mm', height: '75mm', overflow: 'hidden', position: 'relative', margin: '0 auto' }}>
                <div style={{ transform: 'scale(1.5)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                  <LabelPreview label={{
                    labelSeqId: lastLabel.labelSeqId,
                    compositeId: lastLabel.compositeId,
                    partNumber: lastLabel.partNumber,
                    description: lastLabel.description,
                    quantity: lastLabel.quantity,
                    printedBy: lastLabel.printedBy,
                    printedAt: lastLabel.printedAt,
                    msl: lastLabel.msl,
                    expiryDate: lastLabel.expiryDate,
                    shipmentName,
                  }} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center mt-4">Clique em uma etiqueta para visualizar</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
