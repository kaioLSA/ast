import { get, post } from '@/services/api/api'
import { endpoints } from '@/services/api/endpoints'
import type { Campaign, CampaignMetrics } from '@/types/campaign.types'
import type { ApiResponse } from '@/types/global.types'

export async function getMetaCampaigns(): Promise<ApiResponse<Campaign[]>> {
  return get(`${endpoints.campaigns.list}?platform=meta`)
}

export async function syncMetaCampaigns(): Promise<ApiResponse<{ synced: number }>> {
  return post('/integrations/meta/sync')
}

export async function getMetaAdInsights(
  campaignId: string,
  dateRange: { from: string; to: string },
): Promise<ApiResponse<CampaignMetrics>> {
  return get(`/integrations/meta/campaigns/${campaignId}/insights`, dateRange as never)
}

export async function connectMetaAccount(code: string): Promise<ApiResponse<{ connected: boolean }>> {
  return post('/integrations/meta/connect', { code })
}
