import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// ── SSE real-time connection ──────────────────────────────────────────────────
export function useSseUpdates() {
  const qc = useQueryClient();
  const workstationId = useAuthStore(s => s.workstationId);
  const token = useAuthStore(s => s.token);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;

    const url = api.getSseUrl(workstationId || undefined);
    const es = new EventSource(url);
    esRef.current = es;

    const invalidate = (keys: string[]) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

    es.addEventListener('labels:created', () => invalidate(['labels', 'part-numbers']));
    es.addEventListener('labels:deleted', () => invalidate(['labels', 'part-numbers']));
    es.addEventListener('part-numbers:updated', () => invalidate(['part-numbers']));
    es.addEventListener('shipments:created', () => invalidate(['shipments', 'part-numbers']));
    es.addEventListener('workstations:updated', () => invalidate(['workstations']));

    return () => { es.close(); esRef.current = null; };
  }, [token, workstationId, qc]);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function useLogin() {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: api.login,
    onSuccess: (data) => setAuth(data.user, data.token),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const { logout } = useAuthStore();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => { logout(); qc.clear(); },
  });
}

// ── Users (admin) ─────────────────────────────────────────────────────────────
export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: api.getUsers });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof api.updateUser>[1]) =>
      api.updateUser(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export function useNetworkInfo() {
  return useQuery({ queryKey: ['network-info'], queryFn: api.getNetworkInfo, staleTime: 60_000 });
}

export function useConnectedClients() {
  return useQuery({ queryKey: ['connected-clients'], queryFn: api.getConnectedClients, refetchInterval: 10_000 });
}

export function useRestoreBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.restoreBackup,
    onSuccess: () => qc.invalidateQueries(),
  });
}

// ── Shipments ─────────────────────────────────────────────────────────────────
export function useShipments() {
  return useQuery({ queryKey: ['shipments'], queryFn: api.getShipments });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createShipment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['part-numbers'] });
    },
  });
}

// ── Part Numbers ─────────────────────────────────────────────────────────────
export function usePartNumbers() {
  return useQuery({ queryKey: ['part-numbers'], queryFn: api.getPartNumbers });
}

export function useAuthorizeSurplus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, extraQty }: { id: string; extraQty: number }) =>
      api.authorizePartNumberSurplus(id, extraQty),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['part-numbers'] }),
  });
}

// ── Reservations ─────────────────────────────────────────────────────────────
export function useReservations() {
  return useQuery({ queryKey: ['reservations'], queryFn: api.getReservations });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createReservation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

// ── Labels ───────────────────────────────────────────────────────────────────
export function useLabels() {
  return useQuery({ queryKey: ['labels'], queryFn: api.getLabels });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createLabel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels'] });
      qc.invalidateQueries({ queryKey: ['part-numbers'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteLabel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels'] });
      qc.invalidateQueries({ queryKey: ['part-numbers'] });
    },
  });
}

export function useReprintLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, printerIp }: { id: string; printerIp: string }) =>
      api.reprintLabel(id, printerIp),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labels'] }),
  });
}

// ── Workstations ─────────────────────────────────────────────────────────────
export function useWorkstations() {
  return useQuery({ queryKey: ['workstations'], queryFn: api.getWorkstations, staleTime: 5_000 });
}

export function useCreateWorkstation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createWorkstation(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workstations'] }),
  });
}

export function useUpdateWorkstation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; isOnline?: boolean }) =>
      api.updateWorkstation(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workstations'] }),
  });
}

export function useDeleteWorkstation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteWorkstation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workstations'] }),
  });
}

// ── Divergences ──────────────────────────────────────────────────────────────
export function useDivergences() {
  return useQuery({ queryKey: ['divergences'], queryFn: api.getDivergences });
}

export function useFinalizePartNumber() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  return useMutation({
    mutationFn: (partNumberId: string) =>
      api.finalizePartNumber(partNumberId, user?.name || 'Sistema'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['part-numbers'] });
      qc.invalidateQueries({ queryKey: ['divergences'] });
    },
  });
}
