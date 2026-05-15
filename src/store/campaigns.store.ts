import { create } from 'zustand'
import type { Campaign, CampaignFilters } from '@/types/campaign.types'

interface CampaignsStore {
  campaigns: Campaign[]
  filters: CampaignFilters
  isLoading: boolean
  setCampaigns: (campaigns: Campaign[]) => void
  setFilters: (filters: Partial<CampaignFilters>) => void
  setLoading: (loading: boolean) => void
}

export const useCampaignsStore = create<CampaignsStore>((set, get) => ({
  campaigns: [],
  filters: {},
  isLoading: false,
  setCampaigns: (campaigns) => set({ campaigns }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  setLoading: (isLoading) => set({ isLoading }),
}))
