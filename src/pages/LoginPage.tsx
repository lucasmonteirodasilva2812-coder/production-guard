import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Shield, Cpu, BarChart3, Package } from 'lucide-react';
import { useLogin } from '@/hooks/useProductionData';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface Props {
  onLoggedIn: () => void;
  onBack: () => void;
}

// Logo Multilaser SVG inline
function MultilaseRLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="18" fill="#3B5BDB" />
      <path d="M12 56 L12 24 L28 44 L40 28 L52 44 L68 24 L68 56" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

const features = [
  { icon: Shield, label: 'Controle Total', desc: 'Gestão completa de conferência' },
  { icon: Cpu,    label: 'Tempo Real',    desc: 'Dados sincronizados ao vivo' },
  { icon: BarChart3, label: 'Relatórios', desc: 'Visibilidade operacional' },
  { icon: Package,   label: 'Rastreamento', desc: 'Etiquetas e lotes controlados' },
];

export default function LoginPage({ onLoggedIn, onBack }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const login = useLogin();
  const mode = useAuthStore(s => s.mode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { toast.error('Preencha usuário e senha'); return; }
    login.mutate({ username, password }, {
      onSuccess: () => { toast.success('Bem-vindo!'); onLoggedIn(); },
      onError: (e: any) => toast.error(e.message),
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1E293B', padding: 32, borderRadius: 12, minWidth: 320, boxShadow: '0 2px 16px #0004', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 8, textAlign: 'center' }}>Acesso ao Sistema</h2>
        <div>
          <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>Usuário</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="seu.usuario"
            autoComplete="username"
            autoFocus
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#fff', fontSize: 15, marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>Senha</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0F172A', color: '#fff', fontSize: 15, marginTop: 4 }}
          />
        </div>
        <button
          type="submit"
          disabled={login.isPending}
          style={{ marginTop: 8, padding: '12px 0', borderRadius: 8, background: '#3B5BDB', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: login.isPending ? 'not-allowed' : 'pointer' }}
        >
          {login.isPending ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
