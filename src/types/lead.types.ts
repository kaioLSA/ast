import type { ID, Timestamp, Nullable } from './global.types'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'inactive'

export type LeadSource =
  | 'organic'
  | 'meta_ads'
  | 'google_ads'
  | 'tiktok_ads'
  | 'whatsapp'
  | 'referral'
  | 'email'
  | 'cold_call'
  | 'website'
  | 'other'

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent'

export type LeadTemperature = 'cold' | 'warm' | 'hot'

export interface LeadContact {
  phone?: string
  whatsapp?: string
  email?: string
  linkedin?: string
  instagram?: string
}

export interface LeadAddress {
  street?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
}

export interface Lead {
  id: ID
  name: string
  company?: string
  contact: LeadContact
  address?: LeadAddress
  status: LeadStatus
  source: LeadSource
  priority: LeadPriority
  temperature: LeadTemperature
  value?: number
  tags: string[]
  notes?: string
  assignedTo?: ID
  assignedUser?: { id: ID; name: string; avatar?: string }
  campaignId?: ID
  aiScore?: number
  aiInsights?: string
  lastInteraction?: Timestamp
  nextFollowUp?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface LeadActivity {
  id: ID
  leadId: ID
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'status_change'
  description: string
  userId: ID
  user?: { id: ID; name: string; avatar?: string }
  metadata?: Record<string, unknown>
  createdAt: Timestamp
}

export interface KanbanColumn {
  id: LeadStatus
  title: string
  leads: Lead[]
  count: number
  totalValue: number
}

export interface LeadFilters {
  status?: LeadStatus[]
  source?: LeadSource[]
  priority?: LeadPriority[]
  temperature?: LeadTemperature[]
  assignedTo?: ID[]
  tags?: string[]
  dateRange?: { from: Date; to: Date }
  valueMin?: number
  valueMax?: number
  search?: string
}

export interface CreateLeadPayload {
  name: string
  company?: string
  contact: LeadContact
  source: LeadSource
  priority?: LeadPriority
  value?: number
  tags?: string[]
  notes?: string
  assignedTo?: ID
}

export interface UpdateLeadPayload extends Partial<CreateLeadPayload> {
  status?: LeadStatus
  temperature?: LeadTemperature
  nextFollowUp?: Timestamp
}
