import React, { useState } from 'react';
import { useProductionStore } from '@/store/productionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUp, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportPage() {
  const store = useProductionStore();
  const [manualData, setManualData] = useState('');
  const [fileName, setFileName] = useState('');

  const handleImportManual = () => {
    if (!manualData.trim()) {
      toast.error('Insira os dados da planilha');
      return;
    }

    const lines = manualData.trim().split('\n').filter(l => l.trim());
    const parts: { partNumber: string; description: string; quantity: number }[] = [];

    for (const line of lines) {
      const cols = line.split(/[;\t,]/).map(c => c.trim());
      if (cols.length >= 3) {
        const qty = parseInt(cols[2]);
        if (!isNaN(qty) && qty > 0) {
          parts.push({ partNumber: cols[0], description: cols[1], quantity: qty });
        }
      }
    }

    if (parts.length === 0) {
      toast.error('Nenhum dado válido encontrado. Use o formato: PartNumber;Descrição;Quantidade');
      return;
    }

    store.importShipment(fileName || `import_${new Date().toISOString().slice(0, 10)}`, parts);
    toast.success(`${parts.length} Part Numbers importados com sucesso!`);
    setManualData('');
    setFileName('');
  };

  const handleLoadSample = () => {
    const sample = `ABC-001;Parafuso M6x20;5000
ABC-002;Arruela Lisa 6mm;10000
ABC-003;Porca Sextavada M6;8000
DEF-100;Conector Elétrico 4P;3000
DEF-101;Terminal Fêmea 2.5mm;15000`;
    setManualData(sample);
    setFileName('amostra_remessa.xlsx');
    toast.info('Dados de exemplo carregados');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Importar Planilha</h1>
        <p className="text-sm text-muted-foreground">Importar dados de remessa para etiquetagem</p>
      </div>

      <div className="industrial-panel p-6 space-y-4">
        <div className="flex items-center gap-2 text-info mb-2">
          <FileUp className="w-5 h-5" />
          <span className="text-sm font-medium">Importação Manual</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Cole os dados no formato: <code className="font-mono bg-muted px-1 rounded">PartNumber;Descrição;Quantidade</code> (um por linha)
        </p>

        <Input
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          placeholder="Nome do arquivo (ex: remessa_001.xlsx)"
          className="font-mono"
        />

        <textarea
          value={manualData}
          onChange={e => setManualData(e.target.value)}
          placeholder="ABC-001;Parafuso M6x20;5000&#10;ABC-002;Arruela Lisa 6mm;10000"
          className="w-full h-48 bg-background border border-input rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="flex gap-3">
          <Button onClick={handleImportManual} className="gap-2">
            <Upload className="w-4 h-4" />
            Importar Dados
          </Button>
          <Button variant="outline" onClick={handleLoadSample}>
            Carregar Exemplo
          </Button>
        </div>
      </div>

      {/* Import History */}
      {store.shipments.length > 0 && (
        <div className="industrial-panel p-4">
          <h2 className="text-sm font-semibold mb-3">Histórico de Importações</h2>
          <div className="space-y-2">
            {store.shipments.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{s.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.totalParts} PNs · {s.totalQuantity.toLocaleString()} unidades · por {s.importedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.importedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="industrial-panel p-4 border-warning/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="text-warning font-medium mb-1">Nota sobre importação de arquivos</p>
            <p>No momento, a importação é feita via texto. Com o backend ativado (Lovable Cloud), será possível fazer upload direto de arquivos .xlsx com parsing automático.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
