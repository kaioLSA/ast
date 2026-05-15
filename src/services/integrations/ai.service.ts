import { post } from '@/services/api/api'
import { endpoints } from '@/services/api/endpoints'
import type { AICompletionRequest, AIConversation, AIInsight, AISuggestion } from '@/types/ai.types'
import type { ApiResponse } from '@/types/global.types'

export async function sendAIMessage(request: AICompletionRequest): Promise<ApiResponse<{ content: string; conversationId: string }>> {
  return post(endpoints.ai.chat, request)
}

export async function* streamAIMessage(request: AICompletionRequest): AsyncGenerator<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api${endpoints.ai.stream}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.body) throw new Error('No response body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(Boolean)
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6)
        if (json === '[DONE]') return
        try {
          const parsed = JSON.parse(json)
          yield parsed.delta ?? ''
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}

export async function getAIInsights(entityId?: string, entityType?: string): Promise<ApiResponse<AIInsight[]>> {
  return post(endpoints.ai.insights, { entityId, entityType })
}

export async function getLeadAIScore(leadId: string): Promise<ApiResponse<{ score: number; insights: string }>> {
  return post(endpoints.ai.leadScore(leadId))
}

export async function getAISuggestions(context: string): Promise<ApiResponse<AISuggestion[]>> {
  return post(endpoints.ai.suggestions, { context })
}
