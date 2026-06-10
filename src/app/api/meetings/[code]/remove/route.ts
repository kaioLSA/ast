import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, removeLiveKitParticipant } from '@/lib/livekit-server'

export const dynamic = 'force-dynamic'

// POST — expulsa um participante da sala (somente o host).
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.host_user_id !== user.id) return NextResponse.json({ error: 'not_host' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const identity: string = (body.identity || '').toString()
  if (!identity) return NextResponse.json({ error: 'sem_identity' }, { status: 400 })
  if (identity === `host-${user.id}`) return NextResponse.json({ error: 'nao_pode_se_expulsar' }, { status: 400 })

  try {
    await removeLiveKitParticipant(m.code, identity)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'erro' }, { status: 500 })
  }
}
