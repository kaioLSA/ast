import type { LeadStatus, LeadSource, LeadPriority, LeadTemperature } from '@/types/lead.types'
import type { SelectOption } from '@/types/global.types'

export const LEAD_STATUS_OPTIONS: SelectOption<LeadStatus>[] = [
  { label: 'Novo', value: 'new' },
  { label: 'Contactado', value: 'contacted' },
  { label: 'Qualificado', value: 'qualified' },
  { label: 'Proposta', value: 'proposal' },
  { label: 'Negociação', value: 'negotiation' },
  { label: 'Ganho', value: 'won' },
  { label: 'Perdido', value: 'lost' },
  { label: 'Inativo', value: 'inactive' },
]

export const LEAD_SOURCE_OPTIONS: SelectOption<LeadSource>[] = [
  { label: 'Orgânico', value: 'organic' },
  { label: 'Meta Ads', value: 'meta_ads' },
  { label: 'Google Ads', value: 'google_ads' },
  { label: 'TikTok Ads', value: 'tiktok_ads' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Indicação', value: 'referral' },
  { label: 'Email', value: 'email' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Website', value: 'website' },
  { label: 'Outro', value: 'other' },
]

export const LEAD_PRIORITY_OPTIONS: SelectOption<LeadPriority>[] = [
  { label: 'Baixa', value: 'low' },
  { label: 'Média', value: 'medium' },
  { label: 'Alta', value: 'high' },
  { label: 'Urgente', value: 'urgent' },
]

export const LEAD_TEMPERATURE_OPTIONS: SelectOption<LeadTemperature>[] = [
  { label: 'Frio', value: 'cold' },
  { label: 'Morno', value: 'warm' },
  { label: 'Quente', value: 'hot' },
]

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  proposal: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  negotiation: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  won: 'bg-green-500/10 text-green-400 border-green-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}
