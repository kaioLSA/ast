import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting } from '@/lib/livekit-server'
import { runTranscription } from '@/lib/meeting-transcribe'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// POST — (re)transcreve manualmente as gravações (somente o host)
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.host_user_id !== user.id) return NextResponse.json({ error: 'not_host' }, { status: 403 })

  const { segments } = await runTranscription(m.code)
  return NextResponse.json({ ok: true, segments })
}
