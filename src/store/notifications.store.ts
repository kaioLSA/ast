import { create } from 'zustand'
import type { Notification } from '@/services/mocks/notifications.mock'

interface NotificationsStore {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications]
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    })
  },
  markAsRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    )
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length })
  },
  markAllAsRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, read: true }))
    set({ notifications, unreadCount: 0 })
  },
  removeNotification: (id) => {
    const notifications = get().notifications.filter((n) => n.id !== id)
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length })
  },
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))
