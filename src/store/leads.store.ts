import { create } from 'zustand'
import type { Lead, LeadFilters, KanbanColumn } from '@/types/lead.types'

interface LeadsStore {
  leads: Lead[]
  kanbanColumns: KanbanColumn[]
  selectedLead: Lead | null
  filters: LeadFilters
  isLoading: boolean
  setLeads: (leads: Lead[]) => void
  setKanbanColumns: (columns: KanbanColumn[]) => void
  setSelectedLead: (lead: Lead | null) => void
  setFilters: (filters: Partial<LeadFilters>) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
}

export const useLeadsStore = create<LeadsStore>((set, get) => ({
  leads: [],
  kanbanColumns: [],
  selectedLead: null,
  filters: {},
  isLoading: false,
  setLeads: (leads) => set({ leads }),
  setKanbanColumns: (kanbanColumns) => set({ kanbanColumns }),
  setSelectedLead: (selectedLead) => set({ selectedLead }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  clearFilters: () => set({ filters: {} }),
  setLoading: (isLoading) => set({ isLoading }),
}))
