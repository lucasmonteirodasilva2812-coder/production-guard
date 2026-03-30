import React, { useState } from 'react';
import { useProductionStore } from '@/store/productionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { Printer, AlertTriangle, CheckCircle, RotateCcw, QrCode, Package } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Workstation() {
  const store = useProductionStore();
  const [selectedPN, setSelectedPN] = useState<string | null>(null);
  const [printQty, setPrintQty] = useState('1');
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [showSupervisorAuth, setShowSupervisorAuth] = useState(false);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [qualityLabelId, setQualityLabelId] = useState('');

  const activePNs = store.partNumbers.filter(p => p.status !== 'concluido');
  const selected = store.partNumbers.find(p => p.id === selectedPN);
  const available = selectedPN ? store.getAvailableQty(selectedPN) : 0;
  const reserved = selectedPN ? store.getReservedQty(selectedPN) : 0;

  const recentLabels = store.labels
    .filter(l => l.workstationId === store.currentWorkstation)
    .sort((a, b) => b.printedAt.localeCompare(a.printedAt))
    .slice(0, 20);

  const shouldQualityCheck = recentLabels.length > 0 && recentLabels.length % 50 === 0;

  const handlePrint = () => {
    if (!selectedPN || !selected) return;
    const qty = parseInt(printQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantidade inválida');
      return;
    }
    if (qty > available) {
      if (available <= 0) {
        setShowSupervisorAuth(true);
        toast.warning('Saldo zerado! Necessária autorização de Supervisor.');
        return;
      }
      toast.error(`Quantidade excede o disponível (${available})`);
      return;
    }

    // Create reservation and generate labels
    for (let i = 0; i < qty; i++) {
      const resId = store.createReservation(selectedPN, 1);
      if (resId) {
        store.generateLabel(selectedPN, resId);
      }
    }

    toast.success(`${qty} etiqueta(s) enviada(s) para impressão`, {
      description: `Part Number: ${selected.partNumber}`,
    });

    // Check for quality sampling
    const totalPrinted = store.labels.filter(l => l.workstationId === store.currentWorkstation).length;
    if (totalPrinted > 0 && totalPrinted % 50 === 0) {
      const lastLabel = store.labels[store.labels.length - 1];
      setQualityLabelId(lastLabel.id);
      setShowQualityCheck(true);
    }
  };

  const handleSupervisorAuth = () => {
    if (supervisorPassword === 'super123') {
      if (selectedPN) {
        store.authorizeSurplus(selectedPN, parseInt(printQty) || 1);
        toast.success('Excedente autorizado pelo Supervisor');
        setShowSupervisorAuth(false);
        setSupervisorPassword('');
      }
    } else {
      toast.error('Senha de Supervisor incorreta');
    }
  };

  const handleQualityCheck = () => {
    if (!qualityLabelId) return;
    const check = store.addQualityCheck(qualityLabelId, qrInput);
    if (check.isValid) {
      toast.success('QR Code validado com sucesso!');
    } else {
      toast.error('QR Code INVÁLIDO! Verifique a impressão.');
    }
    setShowQualityCheck(false);
    setQrInput('');
  };

  const handleFinalize = () => {
    if (!selectedPN) return;
    const report = store.finalizePartNumber(selectedPN);
    if (report) {
      toast.warning(`Divergência detectada: ${report.type === 'falta' ? '-' : '+'}${Math.abs(report.difference)} unidades`, {
        description: 'Relatório gerado para o Supervisor.',
        duration: 5000,
      });
    } else {
      toast.success('Part Number finalizado com sucesso!');
    }
    setSelectedPN(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bancada {store.currentWorkstation}</h1>
        <p className="text-sm text-muted-foreground">Impressão de etiquetas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Part Number Selection */}
        <div className="industrial-panel p-4 lg:col-span-1">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Selecionar Part Number
          </h2>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {activePNs.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhum PN disponível</p>
            )}
            {activePNs.map(pn => (
              <button
                key={pn.id}
                onClick={() => setSelectedPN(pn.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  selectedPN === pn.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium">{pn.partNumber}</span>
                  <StatusBadge status={pn.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{pn.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-muted rounded-full h-1">
                    <div
                      className="h-1 rounded-full bg-primary"
                      style={{ width: `${Math.min((pn.labeledQty / pn.declaredQty) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {pn.labeledQty}/{pn.declaredQty}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Print Controls */}
        <div className="industrial-panel p-4 lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{selected.partNumber}</h2>
                <StatusBadge status={selected.status} />
              </div>
              <p className="text-xs text-muted-foreground">{selected.description}</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">Declarado</p>
                  <p className="text-xl font-mono font-bold">{selected.declaredQty.toLocaleString()}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg text-center border border-primary/20">
                  <p className="text-[10px] text-primary uppercase">Disponível</p>
                  <p className="text-xl font-mono font-bold text-primary">{available.toLocaleString()}</p>
                  {reserved > 0 && (
                    <p className="text-[10px] text-warning mt-1">({reserved} em processamento)</p>
                  )}
                </div>
                <div className="bg-success/5 p-3 rounded-lg text-center border border-success/20">
                  <p className="text-[10px] text-success uppercase">Etiquetado</p>
                  <p className="text-xl font-mono font-bold text-success">{selected.labeledQty.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  value={printQty}
                  onChange={e => setPrintQty(e.target.value)}
                  className="w-24 font-mono"
                  placeholder="Qtd"
                />
                <Button onClick={handlePrint} className="flex-1 gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button variant="outline" onClick={handleFinalize}>
                  <CheckCircle className="w-4 h-4" />
                  Finalizar PN
                </Button>
              </div>

              {/* Supervisor Auth Modal */}
              {showSupervisorAuth && (
                <div className="p-4 rounded-lg border border-warning/50 bg-warning/5 space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Autorização de Supervisor Necessária</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Saldo zerado. Insira a senha do Supervisor para autorizar excedente.</p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={supervisorPassword}
                      onChange={e => setSupervisorPassword(e.target.value)}
                      placeholder="Senha do Supervisor"
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleSupervisorAuth}>Autorizar</Button>
                    <Button variant="ghost" onClick={() => setShowSupervisorAuth(false)}>Cancelar</Button>
                  </div>
                </div>
              )}

              {/* Quality Check Modal */}
              {showQualityCheck && (
                <div className="p-4 rounded-lg border border-info/50 bg-info/5 space-y-3">
                  <div className="flex items-center gap-2 text-info">
                    <QrCode className="w-4 h-4" />
                    <span className="text-sm font-medium">Verificação de Qualidade</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Bipe o QR Code da última etiqueta para validar.</p>
                  <div className="flex gap-2">
                    <Input
                      value={qrInput}
                      onChange={e => setQrInput(e.target.value)}
                      placeholder="Dados do QR Code..."
                      className="flex-1 font-mono"
                      autoFocus
                    />
                    <Button variant="outline" onClick={handleQualityCheck}>Validar</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Printer className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selecione um Part Number para começar</p>
              </div>
            </div>
          )}

          {/* Recent Labels */}
          {recentLabels.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Últimas Etiquetas</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {recentLabels.map(label => {
                  const job = store.printJobs.find(j => j.id === label.printJobId);
                  return (
                    <div key={label.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 text-xs">
                      <span className="font-mono text-foreground">{label.compositeId}</span>
                      <span className="text-muted-foreground">{label.partNumber}</span>
                      <div className="flex items-center gap-2">
                        {label.qrValidated && <QrCode className="w-3 h-3 text-success" />}
                        <span className={cn(
                          "text-[10px] uppercase",
                          job?.status === 'printed' ? 'text-success' :
                          job?.status === 'failed' ? 'text-destructive' :
                          'text-warning'
                        )}>
                          {job?.status || 'unknown'}
                        </span>
                        <button
                          onClick={() => {
                            store.reprintLabel(label.id);
                            toast.info(`Reimpressão: ${label.compositeId}`);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
