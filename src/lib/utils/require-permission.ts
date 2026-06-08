import { NextResponse } from 'next/server'
import type { AuthUser } from './get-auth-user'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'leads:read','leads:write','leads:delete',
    'clients:read','clients:write','clients:delete',
    'calendar:read','calendar:write','calendar:delete',
    'campaigns:read','campaigns:write','campaigns:delete',
    'finance:read','finance:write',
    'team:read','team:write','team:delete',
    'settings:read','settings:write',
    'analytics:read','ai:use',
    'whatsapp:read','whatsapp:write',
    'reports:read','forms:read',
    'tasks:read','tasks:write',
  ],
  manager: [
    'leads:read','leads:write',
    'clients:read','clients:write',
    'calendar:read','calendar:write',
    'campaigns:read','campaigns:write',
    'analytics:read','ai:use',
    'whatsapp:read','whatsapp:write',
    'finance:read',
    'team:read',
    'reports:read','forms:read',
    'tasks:read','tasks:write',
  ],
  agent: [
    'leads:read','leads:write',
    'clients:read',
    'calendar:read','calendar:write',
    'campaigns:read',
    'analytics:read','ai:use',
    'whatsapp:read','whatsapp:write',
    'tasks:read','tasks:write',
  ],
  viewer: [
    'leads:read',
    'clients:read',
    'calendar:read',
    'campaigns:read',
    'analytics:read',
    'whatsapp:read',
    'tasks:read',
  ],
}

export function hasPermission(user: AuthUser, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[user.role] ?? []
  return perms.includes(permission)
}

export function forbiddenResponse(permission?: string) {
  return NextResponse.json(
    { error: `Forbidden${permission ? `: requires ${permission}` : ''}` },
    { status: 403 }
  )
}
