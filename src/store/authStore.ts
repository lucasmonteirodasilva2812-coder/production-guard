import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppMode = 'admin' | 'operador';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'supervisor' | 'operador';
}

interface AuthState {
  mode: AppMode | null;
  user: AuthUser | null;
  token: string | null;
  /** Para admin: usa import.meta.env.VITE_API_URL | Para operador: http(s)://<ip>:<port>/api */
  serverUrl: string;
  workstationId: number | null;

  setMode: (mode: AppMode) => void;
  setAuth: (user: AuthUser, token: string) => void;
  setServerUrl: (url: string) => void;
  setWorkstationId: (id: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      mode: null,
      user: null,
      token: null,
      serverUrl: import.meta.env.VITE_API_URL || 'https://production-guard-2.onrender.com/api',
      workstationId: null,

      setMode: (mode) => {
        const serverUrl = import.meta.env.VITE_API_URL || 'https://production-guard-2.onrender.com/api';
        set({ mode, serverUrl });
      },
      setAuth: (user, token) => set({ user, token }),
      setServerUrl: (url) => set({ serverUrl: url }),
      setWorkstationId: (id) => set({ workstationId: id }),
      logout: () => set({ user: null, token: null, workstationId: null }),
    }),
    {
      name: 'pg-auth',
      // Only persist serverUrl and mode — token/user re-validated on load
      partialize: (s) => ({ serverUrl: s.serverUrl, mode: s.mode }),
    }
  )
);
