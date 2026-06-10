import { NextResponse } from 'next/server'
import { getMeeting, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

export const dynamic = 'force-dynamic'

// GET — fotos dos participantes do CRM por identity (ex: { "host-<id>": "data:..." }).
// Público: qualquer pessoa na sala precisa ver a foto do anfitrião.
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({})

  const map: Record<string, string> = {}
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_users?select=avatar_url&id=eq.${m.host_user_id}&limit=1`,
      { headers: sbHeaders(), cache: 'no-store' },
    )
    const rows = res.ok ? await res.json() : []
    const avatar = rows?.[0]?.avatar_url
    if (avatar) map[`host-${m.host_user_id}`] = avatar
  } catch { /* ignore */ }

  return NextResponse.json(map)
}
