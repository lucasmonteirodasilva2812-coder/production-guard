// API client centralizado para comunicação com o backend
import { useAuthStore } from '../store/authStore';

const getBaseUrl = () => import.meta.env.VITE_API_URL;

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = baseUrl + (path.startsWith('/') ? path : `/${path}`);
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  me: () => request<any>('/auth/me'),

  // Users (admin)
  getUsers: () => request<any[]>('/users'),
  createUser: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: number) => request<any>(`/users/${id}`, { method: 'DELETE' }),

  // Admin
  getNetworkInfo: () => request<any>('/admin/network-info'),
  getConnectedClients: () => request<any>('/admin/connected-clients'),
  restoreBackup: (file: File) => {
    const baseUrl = getBaseUrl();
    const token = useAuthStore.getState().token;
    const form = new FormData();
    form.append('file', file);
    return fetch(`${baseUrl}/admin/restore${token ? `?_token=${token}` : ''}`, {
      method: 'POST',
      body: form,
    }).then(res => {
      if (!res.ok) throw new Error('Falha ao restaurar backup');
      return res.json();
    });
  },

  // Shipments
  getShipments: () => request<any[]>('/shipments'),
  createShipment: (data: any) => request<any>('/shipments', { method: 'POST', body: JSON.stringify(data) }),

  // Part Numbers
  getPartNumbers: () => request<any[]>('/part-numbers'),
  authorizeSurplus: (id: number) => request<any>(`/part-numbers/${id}/authorize-surplus`, { method: 'POST' }),

  // Reservations
  getReservations: () => request<any[]>('/reservations'),
  createReservation: (data: any) => request<any>('/reservations', { method: 'POST', body: JSON.stringify(data) }),

  // Labels
  getLabels: () => request<any[]>('/labels'),
  getLabelById: (id: number) => request<any>(`/labels/${id}`),
  createLabel: (data: any) => request<any>('/labels', { method: 'POST', body: JSON.stringify(data) }),
  deleteLabel: (id: number) => request<any>(`/labels/${id}`, { method: 'DELETE' }),
  reprintLabel: (id: number) => request<any>(`/labels/${id}/reprint`, { method: 'POST' }),

  // Workstations
  getWorkstations: () => request<any[]>('/workstations'),
  updateWorkstation: (id: number, data: any) => request<any>(`/workstations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Divergences
  getDivergences: () => request<any[]>('/divergences'),
  finalizePartNumber: (id: number) => request<any>(`/divergences/finalize/${id}`, { method: 'POST' }),

  // SSE (não usado diretamente, só para referência)
  // sse: (workstationId?: number) => {
  //   const baseUrl = getBaseUrl();
  //   const token = useAuthStore.getState().token;
  //   let url = `${baseUrl}/sse`;
  //   if (workstationId) url += `?workstationId=${workstationId}`;
  //   if (token) url += (url.includes('?') ? '&' : '?') + `_token=${token}`;
  //   return new EventSource(url);
  // },
};
