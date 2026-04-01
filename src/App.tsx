import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/AppLayout';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

import SplashScreen from './pages/SplashScreen';
import ModeSelect from './pages/ModeSelect';
import OperatorSetup from './pages/OperatorSetup';
import LoginPage from './pages/LoginPage';
import WorkstationSelect from './pages/WorkstationSelect';
import Dashboard from './pages/Dashboard';
import Workstation from './pages/Workstation';
import ImportPage from './pages/ImportPage';
import Supervisor from './pages/Supervisor';
import AdminPage from './pages/AdminPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000, refetchOnWindowFocus: false } },
});

type Screen =
  | 'splash'
  | 'mode-select'
  | 'operator-setup'
  | 'login'
  | 'workstation-select'
  | 'app';

export default function App() {
  const { mode, token, user, serverUrl, workstationId } = useAuthStore();
  const [screen, setScreen] = useState<Screen>('splash');

  // After splash, determine where to go
  const handleSplashDone = () => {
    if (!mode) { setScreen('mode-select'); return; }
    if (!token) {
      if (mode === 'operador') { setScreen('operator-setup'); return; }
      setScreen('login');
      return;
    }
    // Re-validate token against server
    api.me().then(u => {
      useAuthStore.getState().setAuth(u, token);
      if (mode === 'operador' && !workstationId) {
        setScreen('workstation-select');
      } else {
        setScreen('app');
      }
    }).catch(() => {
      useAuthStore.getState().logout();
      setScreen('login');
    });
  };

  if (screen === 'splash') return <SplashScreen onDone={handleSplashDone} />;
  if (screen === 'mode-select') return (
    <ModeSelect onSelect={() => {
      const { mode: m } = useAuthStore.getState();
      setScreen(m === 'operador' ? 'operator-setup' : 'login');
    }} />
  );
  if (screen === 'operator-setup') return (
    <OperatorSetup
      onDone={() => setScreen('login')}
      onBack={() => { useAuthStore.getState().setMode(null); setScreen('mode-select'); }}
    />
  );
  if (screen === 'login') return (
    <QueryClientProvider client={queryClient}>
      <LoginPage
        onLoggedIn={() => {
          const { mode: m, workstationId: wsId } = useAuthStore.getState();
          if (m === 'operador' && !wsId) setScreen('workstation-select');
          else setScreen('app');
        }}
        onBack={() => {
          const { mode: m } = useAuthStore.getState();
          setScreen(m === 'operador' ? 'operator-setup' : 'mode-select');
        }}
      />
    </QueryClientProvider>
  );
  if (screen === 'workstation-select') return (
    <QueryClientProvider client={queryClient}>
      <WorkstationSelect
        onSelected={() => setScreen('app')}
        onBack={() => setScreen('login')}
      />
    </QueryClientProvider>
  );

  // Main app
  const isAdmin = mode === 'admin';
  const isOperator = mode === 'operador';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workstation" element={<Workstation />} />
              {(isAdmin || user?.role === 'supervisor') && (
                <>
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/supervisor" element={<Supervisor />} />
                </>
              )}
              {isAdmin && <Route path="/admin" element={<AdminPage />} />}
              {isOperator && (
                <>
                  <Route path="/import" element={<Navigate to="/" replace />} />
                  <Route path="/supervisor" element={<Navigate to="/" replace />} />
                  <Route path="/admin" element={<Navigate to="/" replace />} />
                </>
              )}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
