import { create } from 'zustand'

interface WhatsAppStore {
  /** Raw unread from Evolution API (usually 0 — not reliable) */
  totalUnread: number
  setTotalUnread: (n: number) => void

  /** Sidebar/favicon badge — incremented on each new incoming message detected */
  pendingCount: number
  incrementPending: () => void
  clearPending: () => void

  /** Per-chat unread counts tracked locally (since Evolution returns 0) */
  localUnread: Record<string, number>
  incrementChatUnread: (chatId: string) => void
  clearChatUnread: (chatId: string) => void
}

export const useWhatsAppStore = create<WhatsAppStore>((set) => ({
  totalUnread: 0,
  setTotalUnread: (totalUnread) => set({ totalUnread }),

  pendingCount: 0,
  incrementPending: () => set((s) => ({ pendingCount: s.pendingCount + 1 })),
  clearPending: () => set({ pendingCount: 0 }),

  localUnread: {},
  incrementChatUnread: (chatId) =>
    set((s) => ({ localUnread: { ...s.localUnread, [chatId]: (s.localUnread[chatId] ?? 0) + 1 } })),
  clearChatUnread: (chatId) =>
    set((s) => {
      const next = { ...s.localUnread }
      delete next[chatId]
      return { localUnread: next }
    }),
}))
