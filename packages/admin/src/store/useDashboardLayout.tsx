import { create } from "zustand";

interface DashboardLayoutState {
  isEnabled: boolean;
  toggleEnabled: () => void;
  iframe: HTMLIFrameElement | null;
  setIframe: (iframe: HTMLIFrameElement | null) => void;
}

export const useDashboardLayout = create<DashboardLayoutState>((set) => ({
  isEnabled: false,
  toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),
  iframe: null,
  setIframe: (iframe) => set(() => ({ iframe })),
}));
