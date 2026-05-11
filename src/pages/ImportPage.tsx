import React, { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useShipments, useCreateShipment, usePartNumbers } from '@/hooks/useProductionData';
import { Input } from '@/components/ui/input';
import { FileUp, CheckCircle, AlertCircle, Search, Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// xlsx imported dynamically to keep bundle lean
async function parseExcelFile(file: File): Promise<{ partNumber: string; description: string; quantity: number }[]> {
  // xlsx types resolved at runtime
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const parts: { partNumber: string; description: string; quantity: number }[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const pn = String(row[0] || '').trim();
    const desc = String(row[1] || '').trim();
    const qty = parseInt(String(row[2] || '0'));
    if (pn && !isNaN(qty) && qty > 0) parts.push({ partNumber: pn, description: desc, quantity: qty });
  }
  return parts;
}

export default function ImportPage() {
  const user = useAuthStore(s => s.user);
  const { data: shipments = [] } = useShipments();
  const createShipment = useCreateShipment();
  const { data: partNumbers = [] } = usePartNumbers();
  // Removido campo de nome manual da remessa
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Formato inválido. Use .xlsx, .xls ou .csv');
      return;
    }
    // Nome da remessa será sempre o nome original do arquivo
    try {
      let parts: { partNumber: string; description: string; quantity: number }[] = [];
      if (file.name.match(/\.csv$/i)) {
        const text = await file.text();
        for (const line of text.split('\n')) {
          const cols = line.split(/[;,\t]/).map(c => c.trim());
          if (cols.length >= 3) {
            const qty = parseInt(cols[2]);
            if (cols[0] && !isNaN(qty) && qty > 0) parts.push({ partNumber: cols[0], description: cols[1] || '', quantity: qty });
          }
        }
      } else {
        parts = await parseExcelFile(file);
      }

      if (parts.length === 0) {
        toast.error('Nenhum dado válido encontrado no arquivo');
        return;
      }

      createShipment.mutate(
        { fileName: file.name, importedBy: user?.name || 'Admin', parts },
        {
          onSuccess: () => {
            toast.success(`${parts.length} Part Numbers importados com sucesso!`);
            if (fileRef.current) fileRef.current.value = '';
          },
          onError: (e: any) => toast.error(`Erro ao importar: ${e.message}`),
        }
      );
    } catch (e: any) {
      toast.error(`Erro ao processar arquivo: ${e.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const filtered = shipments.filter(s =>
    s.fileName.toLowerCase().includes(search.toLowerCase()) ||
    new Date(s.importedAt).toLocaleDateString('pt-BR').includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar Remessa</h1>
        <p className="text-sm text-muted-foreground">Importar Part Numbers de uma planilha Excel</p>
      </div>

      {/* Import form */}
      <div className="industrial-panel p-6 space-y-4">
        <div className="flex items-center gap-2 text-info mb-1">
          <FileUp className="w-5 h-5" />
          <span className="text-sm font-medium">Nova Remessa</span>
        </div>

        {/* Campo de nome/código removido. Nome da remessa será sempre o nome do arquivo importado. */}

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
          )}
        >
          <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm font-medium">Arraste e solte aqui ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground mt-1">Suporta .xlsx, .xls, .csv</p>
          <p className="text-xs text-muted-foreground mt-1">Colunas: <span className="font-mono bg-muted px-1 rounded">PartNumber · Descrição · Quantidade</span></p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
        </div>

        {createShipment.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="w-4 h-4 animate-bounce" />
            Importando...
          </div>
        )}
      </div>

      {/* Remessas table with search */}
      <div className="industrial-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Remessas Importadas</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar remessa..."
              className="pl-8 h-8 text-xs w-48"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {shipments.length === 0 ? 'Nenhuma remessa importada ainda.' : 'Nenhuma remessa encontrada para a busca.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-left">Processos</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-left">Importado</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-right">Part Numbers</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium text-right">Status</th>
                  <th className="pb-2 text-xs text-muted-foreground font-medium">Importado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(s => {
                  const displayName = s.fileName.replace(/\.(xlsx|xls|csv)$/i, "");
                  // Busca todos os part numbers da remessa
                  const pns = partNumbers.filter(pn => pn.shipmentId === s.id);
                  const total = pns.length;
                  const pendentes = pns.filter(pn => pn.status === 'pendente').length;
                  const emConferencia = pns.filter(pn => pn.status === 'em_processo').length;
                  const concluidos = pns.filter(pn => pn.status === 'concluido').length;
                  let status = 'Pendente';
                  if (concluidos === total && total > 0) status = 'Conferido';
                  else if (emConferencia > 0 || concluidos > 0) status = 'Em Conferência';
                  // badge cor
                  let badgeClass = status === 'Conferido' ? 'text-success' : status === 'Em Conferência' ? 'text-info' : 'text-warning';
                  return (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="py-2.5 font-mono font-semibold">{displayName}</td>
                      <td className="py-2.5 text-muted-foreground">
                        {new Date(s.importedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2.5 text-right font-mono">{s.totalParts}</td>
                      <td className="py-2.5 text-right font-mono">
                        <span className={badgeClass}>{status}</span>
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                          {s.importedBy}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="industrial-panel p-4 border-info/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-info mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="text-info font-medium mb-1">Formato da planilha</p>
            <p>Coluna A: Part Number · Coluna B: Descrição · Coluna C: Quantidade declarada (REMESSA)</p>
            <p className="mt-1">A primeira linha pode ser cabeçalho — linhas com quantidade 0 ou inválida são ignoradas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
