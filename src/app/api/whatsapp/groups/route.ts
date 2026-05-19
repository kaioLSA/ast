import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { evoFetch } from '@/lib/utils/evo-fetch'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { subject, participants } = body as { subject?: string; participants?: string[] }

  if (!subject?.trim()) {
    return NextResponse.json({ error: 'Nome do grupo é obrigatório' }, { status: 400 })
  }

  try {
    const result = await evoFetch.post(`/group/create/${EVO_INSTANCE}`, {
      subject: subject.trim(),
      participants: participants ?? [],
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
