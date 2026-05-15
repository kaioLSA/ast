import { io, type Socket } from 'socket.io-client'
import { getLocalStorage } from '@/lib/helpers/storage'
import { STORAGE_KEYS } from '@/lib/constants/app'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001', {
      auth: { token: getLocalStorage<string>(STORAGE_KEYS.AUTH_TOKEN) },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
