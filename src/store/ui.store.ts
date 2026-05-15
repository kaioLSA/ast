import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '@/types/global.types'

interface UIStore {
  sidebarCollapsed: boolean
  theme: Theme
  isGlobalLoading: boolean
  loadingMessage: string
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
  setGlobalLoading: (loading: boolean, message?: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      isGlobalLoading: false,
      loadingMessage: '',
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setTheme: (theme) => set({ theme }),
      setGlobalLoading: (isGlobalLoading, loadingMessage = 'Carregando...') =>
        set({ isGlobalLoading, loadingMessage }),
    }),
    {
      name: 'startsette-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
)
