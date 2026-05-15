export interface Notification {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  action?: { label: string; href: string }
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Novo lead qualificado',
    description: 'Carlos Mendes foi qualificado pela IA com score 87',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    action: { label: 'Ver lead', href: '/leads/1' },
  },
  {
    id: '2',
    title: 'Campanha pausada',
    description: 'Sua campanha "Black Friday 2024" foi pausada por orçamento',
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    action: { label: 'Ver campanha', href: '/campaigns' },
  },
  {
    id: '3',
    title: 'Mensagem recebida',
    description: 'Pedro Oliveira enviou uma mensagem pelo WhatsApp',
    type: 'info',
    read: true,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    action: { label: 'Responder', href: '/whatsapp' },
  },
]
