import type { ID, Timestamp } from './global.types'

export type CampaignPlatform = 'meta' | 'google' | 'tiktok' | 'email' | 'whatsapp'

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export type CampaignObjective =
  | 'awareness'
  | 'traffic'
  | 'engagement'
  | 'leads'
  | 'conversions'
  | 'sales'

export interface CampaignBudget {
  daily?: number
  total?: number
  spent: number
  currency: string
}

export interface CampaignMetrics {
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  conversionRate: number
  costPerConversion: number
  roas: number
  reach: number
}

export interface Campaign {
  id: ID
  name: string
  platform: CampaignPlatform
  status: CampaignStatus
  objective: CampaignObjective
  budget: CampaignBudget
  metrics: CampaignMetrics
  startDate: Timestamp
  endDate?: Timestamp
  targetAudience?: string
  externalId?: string
  createdBy: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AdSet {
  id: ID
  campaignId: ID
  name: string
  status: CampaignStatus
  budget?: CampaignBudget
  metrics: CampaignMetrics
  targeting?: Record<string, unknown>
}

export interface Ad {
  id: ID
  adSetId: ID
  name: string
  status: CampaignStatus
  creative?: {
    headline?: string
    body?: string
    imageUrl?: string
    videoUrl?: string
    callToAction?: string
  }
  metrics: CampaignMetrics
}

export interface CampaignFilters {
  platform?: CampaignPlatform[]
  status?: CampaignStatus[]
  objective?: CampaignObjective[]
  dateRange?: { from: Date; to: Date }
  search?: string
}
