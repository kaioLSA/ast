import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPaginated, post, patch, del } from '@/services/api/api'
import { endpoints } from '@/services/api/endpoints'
import type { Lead, CreateLeadPayload, UpdateLeadPayload, LeadFilters, KanbanColumn } from '@/types/lead.types'
import type { QueryParams } from '@/types/global.types'

const LEADS_KEY = 'leads'

export function useLeads(params?: QueryParams & LeadFilters) {
  return useQuery({
    queryKey: [LEADS_KEY, params],
    queryFn: () => getPaginated<Lead>(endpoints.leads.list, params),
  })
}

export function useLeadKanban() {
  return useQuery({
    queryKey: [LEADS_KEY, 'kanban'],
    queryFn: () => getPaginated<KanbanColumn>(endpoints.leads.kanban),
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => post<Lead>(endpoints.leads.create, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [LEADS_KEY] }),
  })
}

export function useUpdateLead(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateLeadPayload) => patch<Lead>(endpoints.leads.update(id), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [LEADS_KEY] }),
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => del(endpoints.leads.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [LEADS_KEY] }),
  })
}
