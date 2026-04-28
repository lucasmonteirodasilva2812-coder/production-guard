import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TabType = 'normal' | 'caixa';

interface WorkstationNavState {
  selectedShipment: string | null;
  selectedPN: string | null;
  activeTab: TabType;
  setSelectedShipment: (id: string | null) => void;
  setSelectedPN: (id: string | null) => void;
  setActiveTab: (tab: TabType) => void;
  reset: () => void;
}

export const useWorkstationNavStore = create<WorkstationNavState>()(
  persist(
    (set) => ({
      selectedShipment: null,
      selectedPN: null,
      activeTab: 'normal',
      setSelectedShipment: (id) => set({ selectedShipment: id }),
      setSelectedPN: (id) => set({ selectedPN: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      reset: () => set({ selectedShipment: null, selectedPN: null, activeTab: 'normal' }),
    }),
    { name: 'pg-workstation-nav' }
  )
);