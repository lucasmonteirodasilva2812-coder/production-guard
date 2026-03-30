import { create } from 'zustand';
import {
  Shipment, PartNumber, Label, Reservation, PrintJob,
  WorkstationConfig, DivergenceReport, QualityCheck, User,
  PartNumberStatus, PrintJobStatus, ReservationStatus
} from '@/types/production';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generateCompositeId(workstationId: number, daySeq: number): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${date}${String(workstationId).padStart(2, '0')}${String(daySeq).padStart(4, '0')}`;
}

interface ProductionState {
  currentUser: User;
  currentWorkstation: number;
  shipments: Shipment[];
  partNumbers: PartNumber[];
  labels: Label[];
  reservations: Reservation[];
  printJobs: PrintJob[];
  workstations: WorkstationConfig[];
  divergences: DivergenceReport[];
  qualityChecks: QualityCheck[];
  daySequences: Record<number, number>; // workstationId -> count

  // Actions
  setCurrentUser: (user: User) => void;
  setCurrentWorkstation: (id: number) => void;
  importShipment: (fileName: string, parts: { partNumber: string; description: string; quantity: number }[]) => void;
  createReservation: (partNumberId: string, quantity: number) => string | null;
  confirmReservation: (reservationId: string) => void;
  cancelReservation: (reservationId: string) => void;
  generateLabel: (partNumberId: string, reservationId: string) => Label;
  updatePrintJobStatus: (jobId: string, status: PrintJobStatus) => void;
  finalizePartNumber: (partNumberId: string) => DivergenceReport | null;
  reprintLabel: (labelId: string) => void;
  addQualityCheck: (labelId: string, scannedData: string) => QualityCheck;
  getAvailableQty: (partNumberId: string) => number;
  getReservedQty: (partNumberId: string) => number;
  updateWorkstationConfig: (id: number, config: Partial<WorkstationConfig>) => void;
  authorizeSurplus: (partNumberId: string, extraQty: number) => void;
  deleteLabel: (labelId: string) => void;
}

const MOCK_WORKSTATIONS: WorkstationConfig[] = [
  { id: 1, name: 'Bancada 1', printerIp: '192.168.1.101', printerPort: 9100, isOnline: true },
  { id: 2, name: 'Bancada 2', printerIp: '192.168.1.102', printerPort: 9100, isOnline: true },
  { id: 3, name: 'Bancada 3', printerIp: '192.168.1.103', printerPort: 9100, isOnline: false },
  { id: 4, name: 'Bancada 4', printerIp: '192.168.1.104', printerPort: 9100, isOnline: true },
];

export const useProductionStore = create<ProductionState>((set, get) => ({
  currentUser: { id: '1', name: 'Operador 1', role: 'operador', workstationId: 1 },
  currentWorkstation: 1,
  shipments: [],
  partNumbers: [],
  labels: [],
  reservations: [],
  printJobs: [],
  workstations: MOCK_WORKSTATIONS,
  divergences: [],
  qualityChecks: [],
  daySequences: { 1: 0, 2: 0, 3: 0, 4: 0 },

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentWorkstation: (id) => set({ currentWorkstation: id }),

  importShipment: (fileName, parts) => {
    const shipmentId = generateId();
    const shipment: Shipment = {
      id: shipmentId,
      fileName,
      importedAt: new Date().toISOString(),
      importedBy: get().currentUser.name,
      totalParts: parts.length,
      totalQuantity: parts.reduce((sum, p) => sum + p.quantity, 0),
    };
    const newPartNumbers: PartNumber[] = parts.map(p => ({
      id: generateId(),
      shipmentId,
      partNumber: p.partNumber,
      description: p.description,
      declaredQty: p.quantity,
      labeledQty: 0,
      status: 'pendente' as PartNumberStatus,
    }));
    set(s => ({
      shipments: [...s.shipments, shipment],
      partNumbers: [...s.partNumbers, ...newPartNumbers],
    }));
  },

  getAvailableQty: (partNumberId) => {
    const s = get();
    const pn = s.partNumbers.find(p => p.id === partNumberId);
    if (!pn) return 0;
    const reserved = s.reservations
      .filter(r => r.partNumberId === partNumberId && r.status === 'pendente')
      .reduce((sum, r) => sum + r.quantity, 0);
    return pn.declaredQty - pn.labeledQty - reserved;
  },

  getReservedQty: (partNumberId) => {
    return get().reservations
      .filter(r => r.partNumberId === partNumberId && r.status === 'pendente')
      .reduce((sum, r) => sum + r.quantity, 0);
  },

  createReservation: (partNumberId, quantity) => {
    const available = get().getAvailableQty(partNumberId);
    if (quantity > available) return null;
    const reservation: Reservation = {
      id: generateId(),
      partNumberId,
      workstationId: get().currentWorkstation,
      quantity,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };
    set(s => ({ reservations: [...s.reservations, reservation] }));
    // Update PN status
    set(s => ({
      partNumbers: s.partNumbers.map(p =>
        p.id === partNumberId && p.status === 'pendente'
          ? { ...p, status: 'em_processo' as PartNumberStatus }
          : p
      ),
    }));
    return reservation.id;
  },

  confirmReservation: (reservationId) => {
    const reservation = get().reservations.find(r => r.id === reservationId);
    if (!reservation) return;
    set(s => ({
      reservations: s.reservations.map(r =>
        r.id === reservationId ? { ...r, status: 'consumido' as ReservationStatus } : r
      ),
      partNumbers: s.partNumbers.map(p =>
        p.id === reservation.partNumberId
          ? { ...p, labeledQty: p.labeledQty + reservation.quantity }
          : p
      ),
    }));
    // Check if complete
    const pn = get().partNumbers.find(p => p.id === reservation.partNumberId);
    if (pn && pn.labeledQty >= pn.declaredQty) {
      set(s => ({
        partNumbers: s.partNumbers.map(p =>
          p.id === reservation.partNumberId ? { ...p, status: 'concluido' as PartNumberStatus } : p
        ),
      }));
    }
  },

  cancelReservation: (reservationId) => {
    set(s => ({
      reservations: s.reservations.map(r =>
        r.id === reservationId ? { ...r, status: 'cancelado' as ReservationStatus } : r
      ),
    }));
  },

  generateLabel: (partNumberId, reservationId) => {
    const s = get();
    const pn = s.partNumbers.find(p => p.id === partNumberId)!;
    const wsId = s.currentWorkstation;
    const seq = (s.daySequences[wsId] || 0) + 1;
    const compositeId = generateCompositeId(wsId, seq);

    const zpl = `^XA^FO50,50^A0N,40,40^FD${pn.partNumber}^FS^FO50,100^A0N,30,30^FD${pn.description}^FS^FO50,150^A0N,25,25^FDID: ${compositeId}^FS^FO50,200^BQN,2,6^FDQA,${compositeId}|${pn.partNumber}^FS^XZ`;

    const label: Label = {
      id: generateId(),
      compositeId,
      partNumberId,
      partNumber: pn.partNumber,
      description: pn.description,
      workstationId: wsId,
      printedAt: new Date().toISOString(),
      printedBy: s.currentUser.name,
      zplCommand: zpl,
      qrValidated: false,
      printJobId: '',
    };

    const job: PrintJob = {
      id: generateId(),
      labelId: label.id,
      status: 'queued',
      printerIp: s.workstations.find(w => w.id === wsId)?.printerIp || '',
      createdAt: new Date().toISOString(),
      retries: 0,
    };

    label.printJobId = job.id;

    set(s => ({
      labels: [...s.labels, label],
      printJobs: [...s.printJobs, job],
      daySequences: { ...s.daySequences, [wsId]: seq },
    }));

    // Simulate print completion
    setTimeout(() => {
      get().updatePrintJobStatus(job.id, 'printed');
      get().confirmReservation(reservationId);
    }, 1500);

    return label;
  },

  updatePrintJobStatus: (jobId, status) => {
    set(s => ({
      printJobs: s.printJobs.map(j =>
        j.id === jobId ? { ...j, status, completedAt: status === 'printed' ? new Date().toISOString() : j.completedAt } : j
      ),
    }));
  },

  finalizePartNumber: (partNumberId) => {
    const pn = get().partNumbers.find(p => p.id === partNumberId);
    if (!pn) return null;
    const diff = pn.labeledQty - pn.declaredQty;
    if (diff === 0) {
      set(s => ({
        partNumbers: s.partNumbers.map(p =>
          p.id === partNumberId ? { ...p, status: 'concluido' as PartNumberStatus } : p
        ),
      }));
      return null;
    }
    const report: DivergenceReport = {
      id: generateId(),
      partNumberId,
      partNumber: pn.partNumber,
      declaredQty: pn.declaredQty,
      labeledQty: pn.labeledQty,
      difference: diff,
      type: diff < 0 ? 'falta' : 'sobra',
      createdAt: new Date().toISOString(),
      createdBy: get().currentUser.name,
      resolved: false,
    };
    set(s => ({
      divergences: [...s.divergences, report],
      partNumbers: s.partNumbers.map(p =>
        p.id === partNumberId ? { ...p, status: 'divergente' as PartNumberStatus } : p
      ),
    }));
    return report;
  },

  reprintLabel: (labelId) => {
    const label = get().labels.find(l => l.id === labelId);
    if (!label) return;
    const job: PrintJob = {
      id: generateId(),
      labelId,
      status: 'queued',
      printerIp: get().workstations.find(w => w.id === get().currentWorkstation)?.printerIp || '',
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    set(s => ({ printJobs: [...s.printJobs, job] }));
    setTimeout(() => get().updatePrintJobStatus(job.id, 'printed'), 1500);
  },

  addQualityCheck: (labelId, scannedData) => {
    const label = get().labels.find(l => l.id === labelId);
    const expectedData = `${label?.compositeId}|${label?.partNumber}`;
    const isValid = scannedData === expectedData || scannedData === label?.compositeId;
    const check: QualityCheck = {
      id: generateId(),
      labelId,
      compositeId: label?.compositeId || '',
      scannedData,
      isValid,
      checkedAt: new Date().toISOString(),
      checkedBy: get().currentUser.name,
    };
    set(s => ({
      qualityChecks: [...s.qualityChecks, check],
      labels: s.labels.map(l => l.id === labelId ? { ...l, qrValidated: isValid } : l),
    }));
    return check;
  },

  updateWorkstationConfig: (id, config) => {
    set(s => ({
      workstations: s.workstations.map(w => w.id === id ? { ...w, ...config } : w),
    }));
  },

  authorizeSurplus: (partNumberId, extraQty) => {
    set(s => ({
      partNumbers: s.partNumbers.map(p =>
        p.id === partNumberId ? { ...p, declaredQty: p.declaredQty + extraQty } : p
      ),
    }));
  },

  deleteLabel: (labelId) => {
    const label = get().labels.find(l => l.id === labelId);
    if (!label) return;
    set(s => ({
      labels: s.labels.filter(l => l.id !== labelId),
      partNumbers: s.partNumbers.map(p =>
        p.id === label.partNumberId
          ? { ...p, labeledQty: Math.max(0, p.labeledQty - 1) }
          : p
      ),
    }));
  },
}));
