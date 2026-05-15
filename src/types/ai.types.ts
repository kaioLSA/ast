import type { ID, Timestamp } from './global.types'

export type AIModel = 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'claude-3-haiku'

export type AIMessageRole = 'user' | 'assistant' | 'system'

export type AIInsightType =
  | 'lead_score'
  | 'conversion_prediction'
  | 'churn_risk'
  | 'next_action'
  | 'campaign_optimization'
  | 'revenue_forecast'

export interface AIMessage {
  id: ID
  role: AIMessageRole
  content: string
  timestamp: Timestamp
  metadata?: Record<string, unknown>
}

export interface AIConversation {
  id: ID
  title: string
  messages: AIMessage[]
  model: AIModel
  context?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AIInsight {
  id: ID
  type: AIInsightType
  title: string
  description: string
  score?: number
  confidence: number
  recommendations: string[]
  entityId?: ID
  entityType?: 'lead' | 'campaign' | 'deal'
  generatedAt: Timestamp
}

export interface AISuggestion {
  id: ID
  text: string
  category: 'follow_up' | 'message' | 'action' | 'optimization'
  priority: 'low' | 'medium' | 'high'
  context?: string
}

export interface AIStreamChunk {
  delta: string
  done: boolean
  error?: string
}

export interface AIState {
  conversations: AIConversation[]
  activeConversation: AIConversation | null
  insights: AIInsight[]
  suggestions: AISuggestion[]
  isStreaming: boolean
  isLoading: boolean
  error: string | null
}

export interface AICompletionRequest {
  messages: Pick<AIMessage, 'role' | 'content'>[]
  model?: AIModel
  stream?: boolean
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}
