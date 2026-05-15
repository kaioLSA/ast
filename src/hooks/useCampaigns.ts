import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPaginated, post, patch, del } from '@/services/api/api'
import { endpoints } from '@/services/api/endpoints'
import type { Campaign } from '@/types/campaign.types'
import type { QueryParams } from '@/types/global.types'

const CAMPAIGNS_KEY = 'campaigns'

export function useCampaigns(params?: QueryParams) {
  return useQuery({
    queryKey: [CAMPAIGNS_KEY, params],
    queryFn: () => getPaginated<Campaign>(endpoints.campaigns.list, params),
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: [CAMPAIGNS_KEY, id],
    queryFn: () => getPaginated<Campaign>(endpoints.campaigns.detail(id)),
    enabled: !!id,
  })
}

export function useSyncCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => post(endpoints.campaigns.sync(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_KEY] }),
  })
}
