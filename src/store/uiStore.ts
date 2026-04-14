import { create } from 'zustand'

type UiState = {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

/** UI-only state (modals, drawers). Server state stays in TanStack Query. */
export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}))
