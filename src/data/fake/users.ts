import type { User } from '@/types/auth.types'

export const fakeUsers: User[] = [
  {
    id: 'u1',
    name: 'Ana Lima',
    email: 'ana@startsette.com',
    role: 'manager',
    status: 'active',
    permissions: ['leads:read', 'leads:write', 'campaigns:read', 'campaigns:write', 'analytics:read', 'ai:use', 'whatsapp:read', 'whatsapp:write'],
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'u2',
    name: 'Bruno Reis',
    email: 'bruno@startsette.com',
    role: 'agent',
    status: 'active',
    permissions: ['leads:read', 'leads:write', 'campaigns:read', 'analytics:read', 'ai:use', 'whatsapp:read', 'whatsapp:write'],
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
]
