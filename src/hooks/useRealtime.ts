import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * Subscribes to Postgres changes on a table scoped to the current user's company.
 * INSERT  → only fires callback if the row id is not already tracked (avoids dup with optimistic updates)
 * UPDATE  → fires with the updated row
 * DELETE  → fires with the old row id
 */
export function useRealtime<T extends { id: string }>(
  table: 'leads' | 'clients' | 'calendar_events',
  {
    onInsert,
    onUpdate,
    onDelete,
    existingIds,
  }: {
    onInsert?: (row: T) => void
    onUpdate?: (row: T) => void
    onDelete?: (id: string) => void
    /** Pass current list ids so we can skip events for rows we already have (optimistic updates) */
    existingIds?: string[]
  }
) {
  const { user } = useAuthStore()
  const companyId = user?.teamId

  useEffect(() => {
    if (!companyId) return

    const channel = supabase
      .channel(`${table}:${companyId}`)
      .on(
        // @ts-expect-error – overload typing is loose but works at runtime
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `company_id=eq.${companyId}`,
        },
        (payload: { eventType: RealtimeEvent; new: T; old: T }) => {
          if (payload.eventType === 'INSERT') {
            // Skip if we already have this id — means current user did optimistic update
            const alreadyExists = existingIds?.includes(payload.new?.id)
            if (!alreadyExists && onInsert) onInsert(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            if (onUpdate) onUpdate(payload.new)
          } else if (payload.eventType === 'DELETE') {
            if (onDelete) onDelete((payload.old as { id: string })?.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, companyId])
}
