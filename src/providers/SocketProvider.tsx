'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import { getSocket, disconnectSocket } from '@/services/socket/socket-client'
import { useAuthStore } from '@/store/auth.store'

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return
    const socket = getSocket()
    return () => disconnectSocket()
  }, [isAuthenticated])

  const socket = isAuthenticated ? getSocket() : null

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export function useSocket(): Socket | null {
  return useContext(SocketContext)
}
