export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  // Leads
  LEAD_CREATED: 'lead:created',
  LEAD_UPDATED: 'lead:updated',
  LEAD_DELETED: 'lead:deleted',
  LEAD_ASSIGNED: 'lead:assigned',
  // WhatsApp
  MESSAGE_RECEIVED: 'whatsapp:message:received',
  MESSAGE_STATUS: 'whatsapp:message:status',
  CONVERSATION_UPDATED: 'whatsapp:conversation:updated',
  // Notifications
  NOTIFICATION: 'notification',
  SYSTEM_ALERT: 'system:alert',
  // Campaigns
  CAMPAIGN_UPDATED: 'campaign:updated',
  CAMPAIGN_METRICS: 'campaign:metrics',
  // AI
  AI_STREAM_CHUNK: 'ai:stream:chunk',
  AI_STREAM_DONE: 'ai:stream:done',
} as const

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
