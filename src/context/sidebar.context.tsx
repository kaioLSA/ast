'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useUIStore } from '@/store/ui.store'

interface SidebarContextValue {
  isCollapsed: boolean
  toggle: () => void
  collapse: () => void
  expand: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useUIStore()

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed: sidebarCollapsed,
        toggle: toggleSidebar,
        collapse: () => setSidebarCollapsed(true),
        expand: () => setSidebarCollapsed(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebarContext must be used inside SidebarProvider')
  return ctx
}
