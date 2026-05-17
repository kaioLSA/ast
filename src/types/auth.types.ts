import type { ID, Timestamp } from './global.types'

export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer'

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export type Permission =
  | 'leads:read' | 'leads:write' | 'leads:delete'
  | 'campaigns:read' | 'campaigns:write' | 'campaigns:delete'
  | 'finance:read' | 'finance:write'
  | 'team:read' | 'team:write' | 'team:delete'
  | 'settings:read' | 'settings:write'
  | 'analytics:read'
  | 'ai:use'
  | 'whatsapp:read' | 'whatsapp:write'

export interface User {
  id: ID
  name: string
  email: string
  avatar?: string
  role: UserRole
  status: UserStatus
  permissions: Permission[]
  teamId?: ID
  isDemo?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt?: Timestamp
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: Timestamp
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
  companyName: string
  phone?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
  confirmPassword: string
}

export interface AuthState {
  user: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
