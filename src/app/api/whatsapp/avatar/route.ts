import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { evoFetch } from '@/lib/utils/evo-fetch'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE

/** Normalize a phone number to E.164 without + (Brazil default country code = 55) */
function normalize(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  // Already has full Brazil country code
  if (digits.startsWith('55') && digits.length >= 12) return digits
  // Add Brazil country code
  return `55${digits}`
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ url: null })
  if (user.is_demo) return NextResponse.json({ url: null })

  const phone = request.nextUrl.searchParams.get('phone') ?? ''
  const normalized = normalize(phone)
  if (!normalized) return NextResponse.json({ url: null })

  try {
    const data = await evoFetch.get(
      `/chat/fetchProfilePictureUrl/${EVO_INSTANCE}?number=${normalized}&options=link`
    ) as Record<string, unknown>

    const url = (data?.profilePictureUrl ?? data?.url ?? null) as string | null
    return NextResponse.json({ url }, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ url: null })
  }
}
