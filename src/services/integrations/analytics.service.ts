import { get } from '@/services/api/api'
import { endpoints } from '@/services/api/endpoints'
import type { DashboardAnalytics } from '@/types/analytics.types'
import type { ApiResponse, MetricPeriod } from '@/types/global.types'

export async function getDashboardAnalytics(period: string = '30d'): Promise<ApiResponse<DashboardAnalytics>> {
  return get(endpoints.analytics.dashboard, { period } as never)
}

export async function getLeadsAnalytics(period: string = '30d') {
  return get(endpoints.analytics.leads, { period } as never)
}

export async function getCampaignsAnalytics(period: string = '30d') {
  return get(endpoints.analytics.campaigns, { period } as never)
}

export async function getRevenueAnalytics(period: string = '30d') {
  return get(endpoints.analytics.revenue, { period } as never)
}
