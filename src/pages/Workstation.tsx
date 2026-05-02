import React, { useState, useCallback, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { useAuthStore } from '@/store/authStore';
import { useWorkstationNavStore } from '@/store/workstationNavStore';
import {
  useShipments, usePartNumbers, useLabels, useReservations, useWorkstations,
  useCreateReservation, useCreateLabel, useReprintLabel, useFinalizePartNumber, useAuthorizeSurplus,
} from '@/hooks/useProductionData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import LabelPreview, { LabelData } from '@/components/LabelPreview';
import MultipleLabelsModal from '@/components/MultipleLabelsModal';
import { Printer, AlertTriangle, CheckCircle, RotateCcw, QrCode, ChevronLeft, Package2, Box, Search } from 'lucide-react';
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
  const createReservation = useCreateReservation();
  const createLabel = useCreateLabel();
  const reprintLabel = useReprintLabel();
  const finalizePN = useFinalizePartNumber();
  const authorizeSurplus = useAuthorizeSurplus();

  // Persisted navigation state
  const selectedShipment = useWorkstationNavStore(s => s.selectedShipment);
  const setSelectedShipment = useWorkstationNavStore(s => s.setSelectedShipment);
  const activeTab = useWorkstationNavStore(s => s.activeTab);
  const setActiveTab = useWorkstationNavStore(s => s.setActiveTab);
  const selectedPN = useWorkstationNavStore(s => s.selectedPN);
  const setSelectedPN = useWorkstationNavStore(s => s.setSelectedPN);
  const resetNav = useWorkstationNavStore(s => s.reset);
  const [shipmentSearch, setShipmentSearch] = useState('');

  // Form state (normal label)
  const [pnInput, setPnInput] = useState('');
  const [printQty, setPrintQty] = useState('');
  const [msl, setMsl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [lastLabel, setLastLabel] = useState<Label | null>(null);

  // Form state (box label)
  const [boxPn, setBoxPn] = useState('');
  const [boxDesc, setBoxDesc] = useState('');
  const [boxQty, setBoxQty] = useState('');
  const [boxMsl, setBoxMsl] = useState('');
  const [lastBoxLabel, setLastBoxLabel] = useState<LabelData | null>(null);

  // Auth flow
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [showSupervisorAuth, setShowSupervisorAuth] = useState(false);

  // Impressão múltipla
  const [showMultipleModal, setShowMultipleModal] = useState(false);

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
  const handlePrint = () => {
    if (!selectedPN || !selected) { toast.error('Selecione um Part Number'); return; }
    const qty = parseInt(printQty);
    if (isNaN(qty) || qty <= 0) { toast.error('Quantidade inválida'); return; }
    if (qty > available) {
      if (available <= 0) { setShowSupervisorAuth(true); toast.warning('Saldo zerado! Necessária autorização de Supervisor.'); return; }
      toast.error(`Quantidade excede o disponível (${available.toLocaleString('pt-BR')})`);
      return;
    }
    createReservation.mutate(
      { partNumberId: selectedPN, workstationId, quantity: qty },
      {
        onSuccess: (reservation) => {
          createLabel.mutate(
            {
              partNumberId: selectedPN, reservationId: reservation.id,
              workstationId, printedBy: user?.name || 'Operador',
              msl: msl || undefined, expiryDate: expiryDate || undefined, labelType: 'normal',
            },
            {
              onSuccess: (label) => {
                setLastLabel(label);
                toast.success(`Etiqueta gerada!`, { description: `${selected.partNumber} — ${qty.toLocaleString('pt-BR')} un` });
                openLabelPrintPopup(label, () => {
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

  // ── Box label print (web) ────────────────────────────────────────────────
  const handleBoxPrint = () => {
    if (!boxPn.trim()) { toast.error('Informe o Part Number'); return; }
    const qty = parseInt(boxQty);
    if (isNaN(qty) || qty <= 0) { toast.error('Quantidade inválida'); return; }

    // Cria etiqueta de caixa localmente e abre página de impressão web
    const now = new Date().toISOString();
    const boxLabel: LabelData = {
      partNumber: boxPn.trim(), description: boxDesc.trim(),
      quantity: qty, printedBy: user?.name || 'Operador', printedAt: now,
      msl: boxMsl || null, labelType: 'caixa',
    };
    setLastBoxLabel(boxLabel);
    // Salva no estado e abre print
    // Ideal: criar no backend e obter id, mas se não houver endpoint, pode serializar no localStorage/sessionStorage
    // Aqui, exemplo simples:
    const tempId = `caixa-${Date.now()}`;
    window.localStorage.setItem(`box-label-${tempId}`, JSON.stringify(boxLabel));
    openLabelPrintPopup(boxLabel);
    toast.success('Etiqueta de caixa pronta para impressão');
  };

  const handleSupervisorAuth = () => {
    if (!supervisorPassword.trim()) { toast.error('Informe a senha do supervisor'); return; }
    if (!selectedPN) return;
    authorizeSurplus.mutate(
      { id: selectedPN, extraQty: 0 },
      {
        onSuccess: () => {
          toast.success('Excedente autorizado pelo supervisor');
          setShowSupervisorAuth(false);
          setSupervisorPassword('');
        },
        onError: (e: any) => toast.error(`Autorização falhou: ${e.message}`),
      }
    );
  };

  const handleFinalize = () => {
    if (!selectedPN) return;
    finalizePN.mutate(selectedPN, {
      onSuccess: (data) => {
        if (data.divergence) {
          toast.warning(`Divergência: ${data.divergence.type === 'falta' ? '-' : '+'}${Math.abs(data.divergence.difference)} un`);
        } else { toast.success('Part Number finalizado!'); }
        setSelectedPN(null); setPnInput('');
      },
      onError: (e: any) => toast.error(`Erro ao finalizar: ${e.message}`),
    });
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setSelectedShipment(null); setSelectedPN(null); setPnInput(''); resetNav(); }}
          className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Bancada {workstationId}</h1>
          <p className="text-sm text-muted-foreground">
            Remessa: <span className="text-foreground font-medium font-mono">{selectedShipmentData?.fileName}</span>
          </p>
        </div>
        {/* Tabs */}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setActiveTab('normal')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', activeTab === 'normal' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            <Printer className="w-3.5 h-3.5 inline mr-1.5" />Etiqueta
          </button>
          <button onClick={() => setActiveTab('caixa')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', activeTab === 'caixa' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            <Box className="w-3.5 h-3.5 inline mr-1.5" />Caixa
          </button>
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
                        handlePrint();
                        setPrintQty('');
                        const pnInputEl = document.getElementById('pn-input');
                        if (pnInputEl) (pnInputEl as HTMLInputElement).focus();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">MSL</label>
                  <Input value={msl} onChange={e => setMsl(e.target.value)} placeholder="Ex: MSL3" />
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
                  <div className="bg-primary/5 p-2 rounded text-center border border-primary/20">
                    <p className="text-[10px] text-primary uppercase">Disponível</p>
                    <p className="text-lg font-mono font-bold text-primary">{available.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-success/5 p-2 rounded text-center border border-success/20">
                    <p className="text-[10px] text-success uppercase">Físico</p>
                    <p className="text-lg font-mono font-bold text-success">{selected.labeledQty.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              )}


              <div className="flex gap-2">
                <Button onClick={handlePrint} disabled={createLabel.isPending || createReservation.isPending}>
                  <Printer className="w-4 h-4 mr-1" />Imprimir
                </Button>
                {selected && (
                  <>
                    <Button variant="outline" onClick={() => setShowMultipleModal(true)}>
                      Impressão Múltipla
                    </Button>
                    <Button variant="outline" onClick={handleFinalize} disabled={finalizePN.isPending}>
                      <CheckCircle className="w-4 h-4 mr-1" />Finalizar PN
                    </Button>
                  </>
                )}
              </div>
      {/* Modal de impressão múltipla */}
      {selected && (
        <MultipleLabelsModal
          open={showMultipleModal}
          onClose={() => setShowMultipleModal(false)}
          baseLabel={{
            partNumber: selected.partNumber,
            description: selected.description,
            quantity: parseInt(printQty) || 1,
            printedBy: user?.name || 'Operador',
            printedAt: new Date().toISOString(),
            msl: msl || undefined,
            expiryDate: expiryDate || undefined,
            labelType: 'normal',
          }}
        />
      )}

              {showSupervisorAuth && (
                <div className="p-3 rounded-lg border border-warning/50 bg-warning/5 space-y-2">
                  <p className="text-xs font-medium text-warning flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Autorização de Supervisor necessária</p>
                  <div className="flex gap-2">
                    <Input type="password" value={supervisorPassword} onChange={e => setSupervisorPassword(e.target.value)} placeholder="Senha" className="flex-1" />
                    <Button variant="outline" size="sm" onClick={handleSupervisorAuth}>Autorizar</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowSupervisorAuth(false)}>×</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: label preview */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground self-start">Pré-visualização</p>
              {lastLabel ? (
                <>
                  <div className="w-full flex flex-col items-center">
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
                    }} />
                    <Button
                      className="mt-2"
                      onClick={() => {
                        if (lastLabel) openLabelPrintPopup(lastLabel);
                      }}
                    >Imprimir etiqueta</Button>
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
                  <Input value={boxPn} onChange={e => setBoxPn(e.target.value)} placeholder="Ex: CPRE005A" className="font-mono" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Quantidade *</label>
                  <Input type="number" min={1} value={boxQty} onChange={e => setBoxQty(e.target.value)} placeholder="Ex: 10000" className="font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                  <Input value={boxDesc} onChange={e => setBoxDesc(e.target.value)} placeholder="Descrição do produto" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">MSL</label>
                  <Input value={boxMsl} onChange={e => setBoxMsl(e.target.value)} placeholder="Ex: MSL3" />
                </div>
              </div>
              <Button onClick={handleBoxPrint} className="gap-2">
                <Box className="w-4 h-4" />Imprimir Etiqueta de Caixa
              </Button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground self-start">Pré-visualização</p>
              {lastBoxLabel ? (
                <LabelPreview label={lastBoxLabel} />
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
      {recentLabels.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    <button onClick={e => { e.stopPropagation(); reprintLabel.mutate({ id: label.id, printerIp: '' }); toast.info(`Reimpressão: ${label.labelSeqId}`); }}
                      className="text-muted-foreground hover:text-foreground" title="Reimprimir">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="industrial-panel p-4 flex flex-col items-center overflow-auto">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3 self-start">Última Etiqueta</h3>
            {lastLabel ? (
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
              }} />
            ) : (
              <p className="text-xs text-muted-foreground text-center mt-4">Clique em uma etiqueta para visualizar</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
