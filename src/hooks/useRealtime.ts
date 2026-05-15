import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from '@/providers/SocketProvider'
import { SOCKET_EVENTS } from '@/services/socket/realtime-events'
import type { Lead } from '@/types/lead.types'

export function useRealtime() {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    socket.on(SOCKET_EVENTS.LEAD_CREATED, () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    })

    socket.on(SOCKET_EVENTS.LEAD_UPDATED, (lead: Lead) => {
      queryClient.setQueryData(['leads', lead.id], lead)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    })

    socket.on(SOCKET_EVENTS.LEAD_DELETED, () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    })

    socket.on(SOCKET_EVENTS.CAMPAIGN_METRICS, () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    })

    return () => {
      socket.off(SOCKET_EVENTS.LEAD_CREATED)
      socket.off(SOCKET_EVENTS.LEAD_UPDATED)
      socket.off(SOCKET_EVENTS.LEAD_DELETED)
      socket.off(SOCKET_EVENTS.CAMPAIGN_METRICS)
    }
  }, [socket, queryClient])
}
