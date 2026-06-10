import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, deleteLiveKitRoom, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

export const dynamic = 'force-dynamic'

// POST — encerra a reunião para todos (somente o host).
// Marca como encerrada (ninguém entra de novo) e fecha a sala no LiveKit,
// o que dispara o webhook room_finished (transcrição automática + limpeza do chat).
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.host_user_id !== user.id) return NextResponse.json({ error: 'not_host' }, { status: 403 })

  // bloqueia novas entradas imediatamente
  await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${encodeURIComponent(m.code)}`, {
    method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify({ active: false, ended_at: new Date().toISOString() }),
  })

  // desconecta todo mundo (dispara room_finished → transcrição automática)
  await deleteLiveKitRoom(m.code)

  return NextResponse.json({ ok: true })
}
