import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, isExpired, createLiveKitToken, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

async function getAvatar(userId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_users?select=avatar&id=eq.${userId}&limit=1`,
      { headers: sbHeaders(), cache: 'no-store' },
    )
    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0]?.avatar ?? null
  } catch { return null }
}

// POST — gera token de HOST (somente o dono da reunião, autenticado)
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 })
  if (m.host_user_id !== user.id) return NextResponse.json({ error: 'not_host' }, { status: 403 })
  if (isExpired(m)) return NextResponse.json({ error: 'expired' }, { status: 410 })

  const avatar = await getAvatar(user.id)

  const token = await createLiveKitToken({
    room: m.code,
    identity: `host-${user.id}`,
    name: user.name || 'Anfitrião',
    isHost: true,
    metadata: JSON.stringify({ avatar }),
  })
  return NextResponse.json({ token, name: user.name, avatar })
}
