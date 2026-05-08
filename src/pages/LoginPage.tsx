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
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)',
      display: 'flex', fontFamily: "'Inter', system-ui, sans-serif",
      overflow: 'hidden',
    }}>
      {/* Orbs decorativos */}
      <div style={{ position: 'absolute', top: -180, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,91,219,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -120, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Painel esquerdo (branding) ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px 56px',
        position: 'relative',
      }} className="hidden lg:flex">

        {/* Logo + nome */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <MultilaseRLogo size={46} />
            <div>
              <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>Grupo Multilaser</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1 }}>Production Guard</p>
            </div>
          </div>
        </div>

        {/* Headline central */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(59,91,219,0.2)', border: '1px solid rgba(96,165,250,0.25)',
            borderRadius: 99, padding: '6px 16px', marginBottom: 28,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#60A5FA', boxShadow: '0 0 8px #60A5FA' }} />
            <span style={{ fontSize: 12, color: '#93C5FD', fontWeight: 600, letterSpacing: '0.04em' }}>
              {mode === 'admin' ? 'Acesso Administrativo' : 'Acesso Operador'}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 52px)', fontWeight: 900, color: '#f1f5f9', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Sistema de<br />
            <span style={{ background: 'linear-gradient(90deg, #60A5FA, #93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Conferência
            </span><br />
            de Matéria-Prima
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(148,163,184,0.75)', lineHeight: 1.7, maxWidth: 380 }}>
            Controle industrial inteligente para rastreamento, etiquetagem e conferência de componentes eletrônicos.
          </p>

          {/* Feature chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 36, maxWidth: 420 }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="#60A5FA" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{label}</p>
                  <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.65)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé esquerdo */}
        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>© 2026 Grupo Multilaser · Todos os direitos reservados</p>
      </div>

      {/* ── Divisor vertical ── */}
      <div style={{ width: 1, background: 'linear-gradient(to bottom, transparent, rgba(96,165,250,0.2), transparent)', alignSelf: 'stretch', flexShrink: 0 }} className="hidden lg:block" />

      {/* ── Painel direito (form) ── */}
      <div style={{
        width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 40px', position: 'relative',
        flexShrink: 0,
      }}>
        {/* Mobile: logo no topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }} className="lg:hidden">
          <MultilaseRLogo size={38} />
          <div>
            <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Grupo Multilaser</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Production Guard</p>
          </div>
        </div>

        {/* Card de login */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: '40px 36px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        }}>
          {/* Header do card */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Entrar no sistema
              </h2>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                background: mode === 'admin' ? 'rgba(251,191,36,0.15)' : 'rgba(96,165,250,0.15)',
                color: mode === 'admin' ? '#FCD34D' : '#93C5FD',
                border: `1px solid ${mode === 'admin' ? 'rgba(251,191,36,0.3)' : 'rgba(96,165,250,0.3)'}`,
                borderRadius: 99, padding: '4px 12px',
              }}>
                {mode === 'admin' ? 'Admin' : 'Operador'}
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)' }}>Informe suas credenciais de acesso</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(226,232,240,0.8)', marginBottom: 8, letterSpacing: '0.02em' }}>
                Usuário
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="seu.usuario"
                autoComplete="username"
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: '12px 16px',
                  color: '#f1f5f9', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(96,165,250,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(96,165,250,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(226,232,240,0.8)', marginBottom: 8, letterSpacing: '0.02em' }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12, padding: '12px 48px 12px 16px',
                    color: '#f1f5f9', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(96,165,250,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(96,165,250,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(148,163,184,0.6)', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              style={{
                marginTop: 6,
                width: '100%', padding: '13px 24px',
                background: login.isPending
                  ? 'rgba(59,91,219,0.4)'
                  : 'linear-gradient(135deg, #3B5BDB, #1D4ED8)',
                border: '1px solid rgba(96,165,250,0.3)',
                borderRadius: 12, color: '#f1f5f9', fontSize: 14, fontWeight: 700,
                cursor: login.isPending ? 'not-allowed' : 'pointer',
                boxShadow: login.isPending ? 'none' : '0 8px 24px rgba(59,91,219,0.45)',
                transition: 'all 0.2s', letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (!login.isPending) { (e.target as HTMLButtonElement).style.boxShadow = '0 12px 32px rgba(59,91,219,0.6)'; (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.boxShadow = login.isPending ? 'none' : '0 8px 24px rgba(59,91,219,0.45)'; (e.target as HTMLButtonElement).style.transform = 'none'; }}
            >
              {login.isPending ? 'Verificando...' : 'Acessar o Sistema'}
            </button>
          </form>
        </div>

        {/* Voltar */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 24, background: 'none', border: 'none',
            color: 'rgba(148,163,184,0.6)', fontSize: 13, cursor: 'pointer',
            padding: '8px 0', transition: 'color 0.2s', alignSelf: 'center',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#93C5FD')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.6)')}
        >
          <ArrowLeft size={14} />
          Voltar à seleção de modo
        </button>
      </div>
    </div>
  );
}
