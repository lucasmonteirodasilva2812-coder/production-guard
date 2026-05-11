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
import LoginPage from './pages/LoginPage';
import WorkstationSelect from './pages/WorkstationSelect';
import Workstation from './pages/Workstation';
import ImportPage from './pages/ImportPage';
import AdminPage from './pages/AdminPage';
import ModuleSelect from './pages/ModuleSelect';
import BasePage from './pages/BasePage';
import NotFound from './pages/NotFound';
import PrintLabel from './pages/PrintLabel';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000, refetchOnWindowFocus: false } },
});

type Screen =
  | 'splash'
  | 'login'
  | 'module-select'
  | 'workstation-select'
  | 'app';

export default function App() {
  const { mode, token, user, serverUrl, workstationId } = useAuthStore();
  const [screen, setScreen] = useState<Screen>('splash');

  // Sempre força o fluxo de login ao abrir o app
  useEffect(() => {
    useAuthStore.getState().logout();
    useAuthStore.getState().setMode(null);
  }, []);

  // Detecta sessão invalidada por novo login em outro computador
  useEffect(() => {
    const handler = () => {
      setScreen('login');
      // Pequeno delay para o toast aparecer após a tela de login renderizar
      setTimeout(() => {
        import('sonner').then(({ toast }) => {
          toast.warning('Sua sessão foi encerrada — login aberto em outro computador.');
        });
      }, 300);
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  if (screen === 'splash') return <SplashScreen onDone={() => setScreen('login')} />;
  if (screen === 'login') return (
    <QueryClientProvider client={queryClient}>
      <LoginPage
        onLoggedIn={() => {
          const { user: u } = useAuthStore.getState();
          if (u?.role === 'operador') {
            useAuthStore.getState().setMode('operador');
            setScreen('app');
          } else {
            useAuthStore.getState().setMode('admin');
            setScreen('app');
          }
        }}
        onBack={() => setScreen('login')}
      />
    </QueryClientProvider>
  );

  // Main app
  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operador';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/workstation" element={<Workstation />} />
              {(isAdmin || user?.role === 'supervisor') && (
                <>
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/base" element={<BasePage />} />
                  {/* <Route path="/print/label/:id" element={<PrintLabel />} /> */}
                </>
              )}
              {isAdmin && <Route path="/admin" element={<AdminPage />} />}
              {isOperator && (
                <>
                  <Route path="/import" element={<Navigate to="/workstation" replace />} />
                  <Route path="/admin" element={<Navigate to="/workstation" replace />} />
                </>
              )}
              {/* Redirecionar / para /workstation */}
              <Route path="/" element={<Navigate to="/workstation" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
