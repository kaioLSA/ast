import { useState, useCallback } from 'react'
import { useAIStore } from '@/store/ai.store'
import { streamAIMessage, getAIInsights, getAISuggestions } from '@/services/integrations/ai.service'
import type { AICompletionRequest, AIMessageRole } from '@/types/ai.types'

export function useAI() {
  const {
    conversations,
    activeConversation,
    insights,
    suggestions,
    isStreaming,
    isLoading,
    streamingContent,
    appendStreamChunk,
    clearStream,
    setIsStreaming,
    setInsights,
    setSuggestions,
    setLoading,
    setError,
  } = useAIStore()

  const sendMessage = useCallback(async (content: string, systemPrompt?: string) => {
    const messages: Pick<{ role: AIMessageRole; content: string }, 'role' | 'content'>[] = [
      ...(activeConversation?.messages.map(({ role, content }) => ({ role, content })) ?? []),
      { role: 'user' as AIMessageRole, content },
    ]

    const request: AICompletionRequest = { messages, stream: true, systemPrompt }

    clearStream()
    setIsStreaming(true)

    try {
      for await (const chunk of streamAIMessage(request)) {
        appendStreamChunk(chunk)
      }
    } catch (err) {
      setError('Erro ao processar resposta da IA')
    } finally {
      setIsStreaming(false)
    }
  }, [activeConversation, appendStreamChunk, clearStream, setIsStreaming, setError])

  const fetchInsights = useCallback(async (entityId?: string, entityType?: string) => {
    setLoading(true)
    try {
      const res = await getAIInsights(entityId, entityType)
      setInsights(res.data)
    } finally {
      setLoading(false)
    }
  }, [setLoading, setInsights])

  const fetchSuggestions = useCallback(async (context: string) => {
    const res = await getSuggestions(context)
    setSuggestions(res.data)
  }, [setSuggestions])

  return {
    conversations,
    activeConversation,
    insights,
    suggestions,
    isStreaming,
    isLoading,
    streamingContent,
    sendMessage,
    fetchInsights,
  }
}
