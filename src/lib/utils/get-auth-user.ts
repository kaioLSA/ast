import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  company_id: string
  is_demo: boolean
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null

    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId] = decoded.split(':')
    if (!userId) return null

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_users?select=id,email,name,role,company_id,is_demo&id=eq.${userId}&active=eq.true&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) return null

    const rows = await res.json()
    const user = rows?.[0]
    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company_id: user.company_id,
      is_demo: user.is_demo ?? false,
    }
  } catch {
    return null
  }
}
