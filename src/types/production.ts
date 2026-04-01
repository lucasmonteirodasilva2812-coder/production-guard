export type PartNumberStatus = 'pendente' | 'em_processo' | 'concluido' | 'divergente';
export type UserRole = 'operador' | 'supervisor' | 'admin';
export type PrintJobStatus = 'queued' | 'printing' | 'printed' | 'failed' | 'cancelled';
export type ReservationStatus = 'pendente' | 'consumido' | 'cancelado';

export interface Shipment {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  totalParts: number;
  totalQuantity: number;
}

export interface PartNumber {
  id: string;
  shipmentId: string;
  partNumber: string;
  description: string;
  declaredQty: number;
  labeledQty: number;
  status: PartNumberStatus;
}

export interface Reservation {
  id: string;
  partNumberId: string;
  workstationId: number;
  quantity: number;
  status: ReservationStatus;
  createdAt: string;
}

export interface Label {
  id: string;
  labelSeqId: string;       // 12-digit numeric sequential ID
  compositeId: string;      // YYYYMMDDWWSSSS
  partNumberId: string;
  partNumber: string;
  description: string;
  quantity: number;
  workstationId: number;
  printedAt: string;
  printedBy: string;
  zplCommand: string;
  qrValidated: boolean;
  printJobId: string;
  msl: string | null;
  expiryDate: string | null;
  labelType: 'normal' | 'caixa';
}

export interface PrintJob {
  id: string;
  labelId: string;
  status: PrintJobStatus;
  printerIp: string;
  createdAt: string;
  completedAt?: string;
  retries: number;
}

export interface WorkstationConfig {
  id: number;
  name: string;
  isOnline: boolean;
}

export interface DivergenceReport {
  id: string;
  partNumberId: string;
  partNumber: string;
  declaredQty: number;
  labeledQty: number;
  difference: number;
  type: 'falta' | 'sobra';
  createdAt: string;
  createdBy: string;
  resolved: boolean;
}

export interface QualityCheck {
  id: string;
  labelId: string;
  compositeId: string;
  scannedData: string;
  isValid: boolean;
  checkedAt: string;
  checkedBy: string;
}

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
}

// Legacy User type (kept for productionStore compatibility)
export interface User {
  id: string;
  name: string;
  role: UserRole;
  workstationId?: number;
}
