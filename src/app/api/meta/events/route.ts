import { NextResponse, type NextRequest } from 'next/server'

const PIXEL_ID = process.env.META_PIXEL_ID
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN

async function sha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase()
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(request: NextRequest) {
  try {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Meta credentials not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { eventName, email, phone, leadId, value, currency } = body as {
      eventName: string
      email?: string
      phone?: string
      leadId?: string
      value?: number
      currency?: string
    }

    const userData: Record<string, unknown> = {}
    if (email) userData.em = [await sha256(email)]
    if (phone) {
      const cleaned = phone.replace(/\D/g, '')
      userData.ph = [await sha256(cleaned)]
    }
    if (leadId) userData.lead_id = leadId

    const eventData: Record<string, unknown> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'system_generated',
      user_data: userData,
      custom_data: {
        event_source: 'crm',
        lead_event_source: 'Startsette CRM',
        ...(value && { value, currency: currency ?? 'BRL' }),
      },
    }

    const url = `https://graph.facebook.com/v25.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [eventData] }),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('[Meta Pixel] Erro:', result)
      return NextResponse.json({ error: result }, { status: res.status })
    }

    return NextResponse.json({ success: true, result })
  } catch (err) {
    console.error('[Meta Pixel] Exceção:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
