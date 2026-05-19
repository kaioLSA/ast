import { create } from 'zustand'

interface WhatsAppStore {
  /** Raw unread count from Evolution API (may be 0 if API doesn't support it) */
  totalUnread: number
  setTotalUnread: (n: number) => void
  /** Pending incoming messages detected by timestamp comparison — drives the sidebar badge */
  pendingCount: number
  incrementPending: () => void
  clearPending: () => void
}

export const useWhatsAppStore = create<WhatsAppStore>((set) => ({
  totalUnread: 0,
  setTotalUnread: (totalUnread) => set({ totalUnread }),
  pendingCount: 0,
  incrementPending: () => set((s) => ({ pendingCount: s.pendingCount + 1 })),
  clearPending: () => set({ pendingCount: 0 }),
}))
