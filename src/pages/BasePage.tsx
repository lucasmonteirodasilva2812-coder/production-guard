import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePnBase } from '@/hooks/useProductionData';
import { useQueryClient } from '@tanstack/react-query';
import { Database, Upload, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

async function parsePnBaseFile(file: File): Promise<{ partNumber: string; description: string; msl: string }[]> {
  if (file.name.match(/\.csv$/i)) {
    const text = await file.text();
    return text.split('\n').filter(l => l.trim()).map(line => {
      const cols = line.split(/[;,\t]/).map(c => c.trim());
      return { partNumber: cols[0] || '', description: cols[1] || '', msl: cols[2] || '' };
    }).filter(i => i.partNumber && i.partNumber.toLowerCase() !== 'part number');
  }
  // @ts-ignore
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  return rows
    .filter(r => Array.isArray(r) && r.length >= 1)
    .map(r => ({
      partNumber: String(r[0] || '').trim(),
      description: String(r[1] || '').trim(),
      msl: String(r[2] || '').trim(),
    }))
    .filter(i => i.partNumber && i.partNumber.toLowerCase() !== 'part number');
}

export default function BasePage() {
  const { data: pnBase = [], isLoading, refetch } = usePnBase();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');

  const handleImport = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Formato inválido. Use .xlsx, .xls ou .csv');
      return;
    }
    try {
      setImporting(true);
      const items = await parsePnBaseFile(file);
      if (items.length === 0) { toast.error('Nenhum dado encontrado no arquivo'); return; }
      const { api } = await import('@/lib/api');
      await api.importPnBase(items);
      qc.invalidateQueries({ queryKey: ['pn-base'] });
      toast.success(`Base atualizada: ${items.length} Part Numbers importados`);
    } catch (e: any) {
      toast.error(`Erro ao importar base: ${e.message}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filtered = pnBase.filter((item: any) => {
    const q = search.toLowerCase();
    return (
      item.partNumber?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.msl?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Base de Part Numbers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pnBase.length > 0
              ? `${pnBase.length.toLocaleString('pt-BR')} registros na base`
              : 'Nenhum registro ainda'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); }}
          />
          <Button
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            {importing ? 'Importando...' : 'Importar Planilha'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por Part Number, descrição ou MSL..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="industrial-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-3 text-xs text-muted-foreground font-medium text-left w-[200px]">Part Number</th>
                <th className="p-3 text-xs text-muted-foreground font-medium text-left">Descrição</th>
                <th className="p-3 text-xs text-muted-foreground font-medium text-center w-[100px]">MSL</th>
                <th className="p-3 text-xs text-muted-foreground font-medium text-left w-[160px]">Atualizado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted-foreground">
                    {pnBase.length === 0 ? (
                      <div>
                        <Database className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-medium">Base vazia</p>
                        <p className="text-xs mt-1">Importe uma planilha (.xlsx, .xls ou .csv) para começar.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Colunas esperadas: Part Number | Descrição | MSL</p>
                      </div>
                    ) : (
                      <p className="text-sm">Nenhum registro encontrado para "{search}"</p>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map((item: any, idx: number) => (
                <tr key={item.partNumber} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-mono font-semibold text-foreground">{item.partNumber}</td>
                  <td className="p-3 text-muted-foreground">{item.description || '—'}</td>
                  <td className="p-3 text-center">
                    {item.msl ? (
                      <span className="text-xs bg-info/15 text-info px-2 py-0.5 rounded-full font-medium">
                        {item.msl}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-3 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {search ? `${filtered.length} de ${pnBase.length} registros` : `${pnBase.length} registros no total`}
          </div>
        )}
      </div>
    </div>
  );
}
