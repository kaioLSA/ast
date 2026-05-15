import { create } from 'zustand'

interface RealtimeStore {
  isConnected: boolean
  reconnectAttempts: number
  setConnected: (connected: boolean) => void
  incrementReconnect: () => void
  resetReconnect: () => void
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  isConnected: false,
  reconnectAttempts: 0,
  setConnected: (isConnected) => set({ isConnected }),
  incrementReconnect: () => set({ reconnectAttempts: get().reconnectAttempts + 1 }),
  resetReconnect: () => set({ reconnectAttempts: 0 }),
}))
