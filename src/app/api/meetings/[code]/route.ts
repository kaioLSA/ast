import { NextResponse } from 'next/server'
import { getMeeting, isExpired } from '@/lib/livekit-server'

// GET — info pública da reunião (para a tela do convidado)
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 })
  return NextResponse.json({
    title: m.title,
    host_name: m.host_name,
    expired: isExpired(m),
  })
}
