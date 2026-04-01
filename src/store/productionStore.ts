/**
 * productionStore — only kept for backward compatibility.
 * All domain state is handled by React Query (useProductionData.ts).
 * Auth state is handled by authStore.ts.
 * This store re-exports auth store helpers for legacy components.
 */
import { useAuthStore } from './authStore';

export function useProductionStore() {
  const user = useAuthStore(s => s.user);
  const workstationId = useAuthStore(s => s.workstationId) ?? 1;

  return {
    currentUser: {
      id: user?.id ?? '0',
      name: user?.name ?? 'Operador',
      role: (user?.role ?? 'operador') as 'operador' | 'supervisor' | 'admin',
      workstationId,
    },
    currentWorkstation: workstationId,
    // no-op setters (kept for any remaining legacy call sites)
    setCurrentUser: () => {},
    setCurrentWorkstation: () => {},
    workstations: [],
  };
}
