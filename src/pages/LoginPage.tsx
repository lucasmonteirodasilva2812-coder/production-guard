import React, { useState } from 'react';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/useProductionData';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface Props {
  onLoggedIn: () => void;
}

export default function LoginPage({ onLoggedIn }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const login = useLogin();
  const mode = useAuthStore(s => s.mode);
  const serverUrl = useAuthStore(s => s.serverUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Preencha usuário e senha'); return; }
    login.mutate({ username, password }, {
      onSuccess: () => { toast.success('Bem-vindo!'); onLoggedIn(); },
      onError: (e: any) => toast.error(e.message),
    });
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="industrial-panel p-8 w-full max-w-sm mx-4 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Production Guard</h1>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            Acesso — {mode === 'admin' ? 'Administrador' : 'Operador'}
          </p>
        </div>

        {mode === 'operador' && serverUrl && (
          <div className="bg-info/10 border border-info/30 rounded-lg px-3 py-2 text-xs text-info">
            Servidor: <span className="font-mono">{serverUrl.replace('/api', '')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Usuário</label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="usuario"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Senha</label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={login.isPending} className="w-full mt-1">
            {login.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {mode === 'admin' && (
          <p className="text-xs text-muted-foreground/60 text-center">
            Primeiro acesso: <span className="font-mono">admin / admin123</span>
          </p>
        )}
      </div>
    </div>
  );
}
