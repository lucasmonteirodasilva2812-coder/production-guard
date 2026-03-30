import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Printer, FileUp, ShieldCheck, Settings, Monitor,
  Activity
} from 'lucide-react';
import { useProductionStore } from '@/store/productionStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workstation', icon: Printer, label: 'Bancada' },
  { to: '/import', icon: FileUp, label: 'Importar' },
  { to: '/supervisor', icon: ShieldCheck, label: 'Supervisor' },
  { to: '/admin', icon: Settings, label: 'Admin' },
];

export function AppSidebar() {
  const location = useLocation();
  const { currentWorkstation, workstations, currentUser } = useProductionStore();
  const ws = workstations.find(w => w.id === currentWorkstation);

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">LabelPro</h1>
            <p className="text-[10px] text-muted-foreground">Controle de Etiquetagem</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              location.pathname === item.to
                ? "bg-sidebar-accent text-sidebar-primary font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-muted-foreground" />
          <div className="text-xs">
            <p className="text-sidebar-foreground font-medium">{ws?.name || 'Bancada ?'}</p>
            <p className="text-muted-foreground">{ws?.printerIp}</p>
          </div>
          <div className={cn(
            "w-2 h-2 rounded-full ml-auto",
            ws?.isOnline ? "bg-success" : "bg-destructive"
          )} />
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="text-sidebar-foreground">{currentUser.name}</span>
          <span className="ml-1 text-primary capitalize">({currentUser.role})</span>
        </div>
      </div>
    </aside>
  );
}
