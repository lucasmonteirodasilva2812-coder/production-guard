import React, { useState } from 'react';
import { Network, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface Props {
  onDone: () => void;
  onBack: () => void;
}

export default function OperatorSetup({ onDone, onBack }: Props) {
  const { setServerUrl } = useAuthStore();
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('3001');
  const [testing, setTesting] = useState(false);

  const handleConnect = async () => {
    if (!ip.trim()) { toast.error('Informe o IP do servidor Admin'); return; }
    const url = `http://${ip.trim()}:${port.trim()}/api`;
    setTesting(true);
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Servidor não respondeu');
      setServerUrl(url);
      toast.success('Conectado ao servidor Admin!');
      onDone();
    } catch {
      toast.error('Não foi possível conectar. Verifique IP e porta.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="industrial-panel p-8 w-full max-w-md mx-4 space-y-6">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="mt-0.5 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center shrink-0">
            <Network className="w-5 h-5 text-info" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Configurar Servidor</h1>
            <p className="text-xs text-muted-foreground">Configure o endereço do servidor Admin.</p>
          </div>
        </div>

        <div className="bg-muted/40 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Como funciona:</p>
          <p>• O computador Admin deve estar na mesma rede Wi-Fi/LAN</p>
          <p>• O IP e porta são exibidos no Admin em "Informações de Rede"</p>
          <p>• Esta configuração fica salva para uso futuro</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">IP do servidor Admin</label>
            <Input
              value={ip}
              onChange={e => setIp(e.target.value)}
              placeholder="ex: 192.168.1.100"
              className="font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Porta</label>
            <Input
              value={port}
              onChange={e => setPort(e.target.value)}
              placeholder="3001"
              className="font-mono w-32"
            />
          </div>
        </div>

        <Button onClick={handleConnect} disabled={testing} className="w-full gap-2">
          {testing ? 'Conectando...' : (
            <>
              <ArrowRight className="w-4 h-4" />
              Conectar e Continuar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
