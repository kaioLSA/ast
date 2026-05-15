import type { UserRole, Permission } from '@/types/auth.types'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'leads:read', 'leads:write', 'leads:delete',
    'campaigns:read', 'campaigns:write', 'campaigns:delete',
    'finance:read', 'finance:write',
    'team:read', 'team:write', 'team:delete',
    'settings:read', 'settings:write',
    'analytics:read',
    'ai:use',
    'whatsapp:read', 'whatsapp:write',
  ],
  manager: [
    'leads:read', 'leads:write',
    'campaigns:read', 'campaigns:write',
    'finance:read',
    'team:read', 'team:write',
    'settings:read',
    'analytics:read',
    'ai:use',
    'whatsapp:read', 'whatsapp:write',
  ],
  agent: [
    'leads:read', 'leads:write',
    'campaigns:read',
    'analytics:read',
    'ai:use',
    'whatsapp:read', 'whatsapp:write',
  ],
  viewer: [
    'leads:read',
    'campaigns:read',
    'analytics:read',
    'whatsapp:read',
  ],
}

export function hasPermission(
  userPermissions: Permission[],
  required: Permission,
): boolean {
  return userPermissions.includes(required)
}

export function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[],
): boolean {
  return required.some((p) => userPermissions.includes(p))
}

export function hasAllPermissions(
  userPermissions: Permission[],
  required: Permission[],
): boolean {
  return required.every((p) => userPermissions.includes(p))
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}
