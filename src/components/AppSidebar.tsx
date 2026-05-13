import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Factory, FileUp, ShieldCheck, Settings, Monitor,
  Activity, LogOut, ChevronRight, Network, Database
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useProductionData';
import { useWorkstations } from '@/hooks/useProductionData';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, user, workstationId, serverUrl } = useAuthStore();
  const logoutMutation = useLogout();
  const { data: workstations = [] } = useWorkstations();
  const [showServerUrl, setShowServerUrl] = useState(false);

  const ws = workstations.find(w => w.id === workstationId);
  const isAdmin = mode === 'admin';
  const isOperator = mode === 'operador';
  const isSupervisor = mode === 'supervisor';


  const adminNav = [
    { to: '/workstation', icon: Factory, label: "Workflow's" },
    { to: '/import', icon: FileUp, label: 'Importar' },
    { to: '/base', icon: Database, label: 'Base' },
    { to: '/admin', icon: Settings, label: 'Admin' },
  ];

  const supervisorNav = [
    { to: '/workstation', icon: Factory, label: "Workflow's" },
    { to: '/import', icon: FileUp, label: 'Importar' },
    { to: '/base', icon: Database, label: 'Base' },
    // NÃO inclui Admin!
  ];

  const operatorNav = [
    { to: '/workstation', icon: Factory, label: "Workflow's" },
  ];

  let navItems = operatorNav;
  if (isAdmin) navItems = adminNav;
  else if (isSupervisor) navItems = supervisorNav;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        // Volta para tela de login simples sem reload
        if (typeof window !== 'undefined') {
          const evt = new CustomEvent('session-expired');
          window.dispatchEvent(evt);
        }
      },
    });
  };

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">Production Guard</h1>
            <p className="text-[10px] text-muted-foreground capitalize">
              {isAdmin ? '⚙ Administrador' : '🔧 Operador'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              location.pathname === item.to
                ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Workstation info (operator) */}
        {isOperator && ws && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sidebar-accent/30">
            <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="text-xs flex-1 min-w-0">
              <p className="text-sidebar-foreground font-medium truncate">{ws.name}</p>
              <p className="text-muted-foreground truncate">{ws.isOnline ? 'Online' : 'Offline'}</p>
            </div>
            <div className={cn('w-2 h-2 rounded-full shrink-0', ws.isOnline ? 'bg-success' : 'bg-destructive')} />
          </div>
        )}

        {/* User info + logout */}
        <div className="flex items-center gap-2 px-2">
          <div className="text-xs flex-1 min-w-0">
            <p className="text-sidebar-foreground font-medium truncate">{user?.name}</p>
            <p className="text-muted-foreground truncate capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
