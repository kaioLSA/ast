import { create } from 'zustand'

interface WhatsAppStore {
  totalUnread: number
  setTotalUnread: (n: number) => void
}

export const useWhatsAppStore = create<WhatsAppStore>((set) => ({
  totalUnread: 0,
  setTotalUnread: (totalUnread) => set({ totalUnread }),
}))
