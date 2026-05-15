import { get, post } from '@/services/api/api'
import { endpoints } from '@/services/api/endpoints'
import type { ApiResponse, PaginatedResponse } from '@/types/global.types'

export interface WhatsAppConversation {
  id: string
  contact: { name: string; phone: string; avatar?: string }
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  status: 'open' | 'resolved' | 'pending'
}

export interface WhatsAppMessage {
  id: string
  conversationId: string
  content: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  direction: 'inbound' | 'outbound'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  sentAt: string
}

export async function getConversations(): Promise<PaginatedResponse<WhatsAppConversation>> {
  const res = await get<PaginatedResponse<WhatsAppConversation>>(endpoints.whatsapp.conversations)
  return res.data
}

export async function getMessages(conversationId: string): Promise<PaginatedResponse<WhatsAppMessage>> {
  const res = await get<PaginatedResponse<WhatsAppMessage>>(endpoints.whatsapp.messages(conversationId))
  return res.data
}

export async function sendMessage(
  to: string,
  content: string,
  type: 'text' | 'template' = 'text',
): Promise<ApiResponse<WhatsAppMessage>> {
  return post(endpoints.whatsapp.send, { to, content, type })
}
