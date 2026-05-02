import React, { useState, useRef } from 'react';
import {
  useUsers, useCreateUser, useUpdateUser, useDeleteUser,
  useNetworkInfo, useConnectedClients, useRestoreBackup,
  useWorkstations, useUpdateWorkstation, useDeleteWorkstation,
} from '@/hooks/useProductionData';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, Network, HardDrive, Monitor, Download, Upload,
  Plus, Shield, ShieldOff, Trash2, FileSpreadsheet, Wifi
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AdminTab = 'users' | 'network' | 'workstations' | 'backup';

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users');

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'network', label: 'Rede & Clientes', icon: Network },
    { id: 'workstations', label: 'Workflows', icon: Monitor },
    { id: 'backup', label: 'Backup & Exportar', icon: HardDrive },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Administração</h1>
        <p className="text-sm text-muted-foreground">Gerenciamento do sistema</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'network' && <NetworkTab />}
      {tab === 'workstations' && <WorkstationsTab />}
      {tab === 'backup' && <BackupTab />}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const { data: users = [] } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'operador' });
  const [showForm, setShowForm] = useState(false);

  const handleCreate = () => {
    if (!form.username || !form.password || !form.name) { toast.error('Preencha todos os campos'); return; }
    createUser.mutate(form, {
      onSuccess: () => {
        toast.success('Usuário criado');
        setForm({ username: '', password: '', name: '', role: 'operador' });
        setShowForm(false);
      },
      onError: (e: any) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} usuário(s) cadastrado(s)</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />Novo Usuário
        </Button>
      </div>

      {showForm && (
        <div className="industrial-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold">Novo Usuário</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome completo</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="João Silva" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Usuário (login)</label>
              <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="joao.silva" className="font-mono" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Senha</label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Perfil</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="operador">Operador</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={createUser.isPending} size="sm">Criar Usuário</Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="industrial-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-3 text-xs text-muted-foreground font-medium text-left">Nome</th>
              <th className="p-3 text-xs text-muted-foreground font-medium text-left">Usuário</th>
              <th className="p-3 text-xs text-muted-foreground font-medium text-left">Perfil</th>
              <th className="p-3 text-xs text-muted-foreground font-medium text-left">Status</th>
              <th className="p-3 text-xs text-muted-foreground font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u: any) => (
              <tr key={u.id} className={cn('hover:bg-muted/20', u.isBlocked && 'opacity-60')}>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 font-mono text-muted-foreground">{u.username}</td>
                <td className="p-3 capitalize text-sm">{u.role}</td>
                <td className="p-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                    u.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
                    {u.isBlocked ? 'Bloqueado' : 'Ativo'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateUser.mutate({ id: u.id, isBlocked: !u.isBlocked }, {
                        onSuccess: () => toast.success(u.isBlocked ? 'Usuário desbloqueado' : 'Usuário bloqueado'),
                      })}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title={u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    >
                      {u.isBlocked
                        ? <Shield className="w-3.5 h-3.5 text-success" />
                        : <ShieldOff className="w-3.5 h-3.5 text-warning" />}
                    </button>
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Remover usuário "${u.name}"?`))
                            deleteUser.mutate(u.id, { onSuccess: () => toast.success('Usuário removido') });
                        }}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Network Tab ───────────────────────────────────────────────────────────────
function NetworkTab() {
  const { data: netInfo } = useNetworkInfo();
  const { data: clients = [] } = useConnectedClients();

  return (
    <div className="space-y-4">
      <div className="industrial-panel p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" />Informações de Rede
        </h3>
        <div className="bg-info/10 border border-info/30 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-info">Configure os computadores Operadores com:</p>
          {netInfo?.ips.map(ip => (
            <div key={ip} className="flex items-center gap-3 bg-background rounded-lg px-4 py-2.5 border border-border">
              <span className="font-mono text-xl font-bold">{ip}</span>
              <span className="text-muted-foreground text-sm">porta</span>
              <span className="font-mono text-xl font-bold">{netInfo.port}</span>
            </div>
          ))}
          {!netInfo?.ips?.length && <p className="text-sm text-muted-foreground">Nenhum IP de rede local encontrado</p>}
        </div>
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs text-warning">
          <strong>⚠ Importante:</strong> Os computadores clientes (Operadores) precisam estar na <strong>mesma rede Wi-Fi ou LAN</strong> que este servidor.
          Insira o IP e a porta acima na tela de configuração do Operador.
        </div>
      </div>

      <div className="industrial-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" />
          Clientes Conectados
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{clients.length} online</span>
        </h3>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum cliente conectado no momento</p>
        ) : (
          <div className="space-y-2">
            {(clients as any[]).map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse-green" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {c.userRole}{c.workstationId ? ` — Workflow ${c.workstationId}` : ''}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.connectedAt).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Workstations Tab ──────────────────────────────────────────────────────────
function WorkstationsTab() {
  const { data: workstations = [] } = useWorkstations();
  const deleteWS = useDeleteWorkstation();

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Os workflows aparecem automaticamente quando os operadores se conectam. O status é atualizado em tempo real via SSE.
      </p>
      <div className="industrial-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-3 text-xs text-muted-foreground font-medium text-left">Workflow</th>
              <th className="p-3 text-xs text-muted-foreground font-medium text-left">Status</th>
              <th className="p-3 text-xs text-muted-foreground font-medium text-center">Remover</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {workstations.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum workflow registrado ainda
                </td>
              </tr>
            )}
            {workstations.map(ws => (
              <tr key={ws.id} className="hover:bg-muted/20">
                <td className="p-3 font-medium">{ws.name}</td>
                <td className="p-3">
                  <span className="flex items-center gap-1.5 text-xs font-medium w-fit">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', ws.isOnline ? 'bg-success animate-pulse-green' : 'bg-muted-foreground/40')} />
                    <span className={ws.isOnline ? 'text-success' : 'text-muted-foreground'}>
                      {ws.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => {
                      if (ws.isOnline) { toast.error('Não é possível remover uma bancada online'); return; }
                      if (window.confirm(`Remover "${ws.name}"?`))
                        deleteWS.mutate(ws.id, { onSuccess: () => toast.success('Bancada removida') });
                    }}
                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    title="Remover bancada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Backup Tab ────────────────────────────────────────────────────────────────
function BackupTab() {
  const restoreBackup = useRestoreBackup();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    const token = useAuthToken();
    const url = `${api.getBackupUrl()}${token ? `?_token=${token}` : ''}`;
    triggerDownload(url, `backup-${new Date().toISOString().slice(0, 10)}.json`);
    toast.success('Download do backup iniciado');
  };

  const handleDownloadExcel = () => {
    const token = useAuthToken();
    const url = `${api.getExportUrl()}${token ? `?_token=${token}` : ''}`;
    triggerDownload(url, `export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Download do Excel iniciado');
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      restoreBackup.mutate(data, {
        onSuccess: () => toast.success('Backup restaurado com sucesso!'),
        onError: (err: any) => toast.error(`Erro ao restaurar: ${err.message}`),
      });
    } catch {
      toast.error('Arquivo de backup inválido');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="industrial-panel p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />Backup de Dados
        </h3>
        <p className="text-sm text-muted-foreground">
          Faça backup completo em JSON (remessas, etiquetas, configurações). Use para recuperar dados em caso de falha.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleDownloadBackup} className="gap-2">
            <Download className="w-4 h-4" />Baixar Backup (.json)
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={restoreBackup.isPending} className="gap-2">
            <Upload className="w-4 h-4" />
            {restoreBackup.isPending ? 'Restaurando...' : 'Restaurar Backup'}
          </Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
        </div>
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs text-destructive">
          <strong>⚠ Atenção:</strong> Restaurar um backup apaga todos os dados atuais. Esta ação não pode ser desfeita.
        </div>
      </div>

      <div className="industrial-panel p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-success" />Exportar Planilha
        </h3>
        <p className="text-sm text-muted-foreground">
          Exporta todos os Part Numbers com PRODUTOS, DESCRIÇÃO, REMESSA, FÍSICO e DIFERENÇA — mesmo formato da planilha de controle.
        </p>
        <Button onClick={handleDownloadExcel} variant="outline" className="gap-2 border-success/40 text-success hover:bg-success/5">
          <Download className="w-4 h-4" />Exportar Excel (.xlsx)
        </Button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function useAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('pg-auth');
    return raw ? JSON.parse(raw).state?.token ?? null : null;
  } catch { return null; }
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
