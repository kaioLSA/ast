'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useNotificationsStore } from '@/store/notifications.store'
import { useSocket } from '@/providers/SocketProvider'
import { SOCKET_EVENTS } from '@/services/socket/realtime-events'
import type { Notification } from '@/services/mocks/notifications.mock'

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const socket = useSocket()
  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification } =
    useNotificationsStore()

  useEffect(() => {
    if (!socket) return

    socket.on(SOCKET_EVENTS.NOTIFICATION, (notification: Notification) => {
      addNotification(notification)
      toast[notification.type]?.(notification.title, { description: notification.description })
    })

    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION)
    }
  }, [socket, addNotification])

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotificationContext must be used inside NotificationProvider')
  return ctx
}
