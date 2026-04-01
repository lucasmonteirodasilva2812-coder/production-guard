import { Response } from 'express';
import { v4 as uuid } from 'uuid';

interface SseClient {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  workstationId?: number;
  connectedAt: string;
  res: Response;
}

const clients = new Map<string, SseClient>();

export function addSseClient(
  userId: string,
  userName: string,
  userRole: string,
  workstationId: number | undefined,
  res: Response
): string {
  const id = uuid();
  clients.set(id, { id, userId, userName, userRole, workstationId, connectedAt: new Date().toISOString(), res });
  return id;
}

export function removeSseClient(id: string) {
  clients.delete(id);
}

export function broadcast(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => { try { c.res.write(msg); } catch {} });
}

export function getConnectedClients() {
  return Array.from(clients.values()).map(({ id, userId, userName, userRole, workstationId, connectedAt }) => ({
    id, userId, userName, userRole, workstationId, connectedAt,
  }));
}
