
import { useAuthStore } from "@/store/authStore";

function getBase(): string {
  const stored = useAuthStore.getState().serverUrl;
  return stored || import.meta.env.VITE_API_URL || "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getBase()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error("Erro na API");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  login: (body: { username: string; password: string }) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<any>("/auth/logout", {
      method: "POST",
    }),

  me: () =>
    request<any>("/auth/me"),

  getLabelById: (id: string) =>
    request<any>(`/labels/${id}`),
};
  // Auth
  login: (body: { username: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  me: () => request<any>('/auth/me'),

  // Users (admin)
  getUsers: () => request<any[]>('/users'),
  createUser: (body: { username: string; password: string; name: string; role?: string }) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: Partial<{ isBlocked: boolean; password: string; name: string; role: string }>) =>
    request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUser: (id: string) =>
    request<any>(`/users/${id}`, { method: 'DELETE' }),

  // Admin
  getNetworkInfo: () => request<{ port: number | string; ips: string[] }>('/admin/network-info'),
  getConnectedClients: () => request<any[]>('/admin/connected-clients'),
  getBackupUrl: () => `${getBase()}/admin/backup`,
  getExportUrl: () => `${getBase()}/admin/export/excel`,
  restoreBackup: (data: Record<string, any[]>) =>
    request<any>('/admin/restore', { method: 'POST', body: JSON.stringify(data) }),

  // Shipments
  getShipments: () => request<any[]>('/shipments'),
  createShipment: (body: { fileName: string; importedBy: string; parts: any[] }) =>
    request<any>('/shipments', { method: 'POST', body: JSON.stringify(body) }),

  // Part Numbers
  getPartNumbers: () => request<any[]>('/part-numbers'),
  authorizePartNumberSurplus: (id: string, extraQty: number) =>
    request<any>(`/part-numbers/${id}/authorize-surplus`, { method: 'POST', body: JSON.stringify({ extraQty }) }),

  // Reservations
  getReservations: () => request<any[]>('/reservations'),
  createReservation: (body: { partNumberId: string; workstationId: number; quantity: number }) =>
    request<any>('/reservations', { method: 'POST', body: JSON.stringify(body) }),

  // Labels
  getLabels: () => request<any[]>('/labels'),
  createLabel: (body: {
    partNumberId: string; reservationId: string; workstationId: number;
    printedBy: string; msl?: string; expiryDate?: string; labelType?: string;
  }) => request<any>('/labels', { method: 'POST', body: JSON.stringify(body) }),
  deleteLabel: (id: string) => request<any>(`/labels/${id}`, { method: 'DELETE' }),
  reprintLabel: (id: string, printerIp: string) =>
    request<any>(`/labels/${id}/reprint`, { method: 'POST', body: JSON.stringify({ printerIp }) }),

  // Workstations
  getWorkstations: () => request<any[]>('/workstations'),
  createWorkstation: (name: string) =>
    request<any>('/workstations', { method: 'POST', body: JSON.stringify({ name }) }),
  updateWorkstation: (id: number, body: Partial<{ isOnline: boolean }>) =>
    request<any>(`/workstations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteWorkstation: (id: number) =>
    request<any>(`/workstations/${id}`, { method: 'DELETE' }),

  // Divergences
  getDivergences: () => request<any[]>('/divergences'),
  finalizePartNumber: (partNumberId: string, createdBy: string) =>
    request<any>(`/divergences/finalize/${partNumberId}`, { method: 'POST', body: JSON.stringify({ createdBy }) }),

  // SSE URL helper
  getSseUrl: (workstationId?: number) => {
    const base = getBase().replace('/api', '');
    const token = useAuthStore.getState().token;
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (workstationId) params.set('workstationId', String(workstationId));
    return `${base}/api/sse?${params}`;
  },
};
