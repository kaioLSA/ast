import { create } from 'zustand'
import type { AIConversation, AIInsight, AISuggestion } from '@/types/ai.types'

interface AIStore {
  conversations: AIConversation[]
  activeConversation: AIConversation | null
  insights: AIInsight[]
  suggestions: AISuggestion[]
  isStreaming: boolean
  isLoading: boolean
  streamingContent: string
  error: string | null
  setActiveConversation: (conversation: AIConversation | null) => void
  addConversation: (conversation: AIConversation) => void
  appendStreamChunk: (chunk: string) => void
  clearStream: () => void
  setIsStreaming: (streaming: boolean) => void
  setInsights: (insights: AIInsight[]) => void
  setSuggestions: (suggestions: AISuggestion[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAIStore = create<AIStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  insights: [],
  suggestions: [],
  isStreaming: false,
  isLoading: false,
  streamingContent: '',
  error: null,
  setActiveConversation: (activeConversation) => set({ activeConversation }),
  addConversation: (conversation) =>
    set({ conversations: [conversation, ...get().conversations] }),
  appendStreamChunk: (chunk) =>
    set({ streamingContent: get().streamingContent + chunk }),
  clearStream: () => set({ streamingContent: '' }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setInsights: (insights) => set({ insights }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
