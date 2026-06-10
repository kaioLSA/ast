import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

const API_KEY = process.env.LIVEKIT_API_KEY ?? ''
const API_SECRET = process.env.LIVEKIT_API_SECRET ?? ''
const HTTP_URL = (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '')
  .replace(/^wss:/, 'https:')
  .replace(/^ws:/, 'http:')

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

// Gera código legível da sala: ex "qno-fkda-msp"
export function generateMeetingCode(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyz'
  const pick = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${pick(3)}-${pick(4)}-${pick(3)}`
}

export async function createLiveKitToken(opts: {
  room: string
  identity: string
  name: string
  isHost?: boolean
  metadata?: string
}): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: opts.identity,
    name: opts.name,
    ttl: '12h',
    metadata: opts.metadata,
  })
  at.addGrant({
    roomJoin: true,
    room: opts.room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: !!opts.isHost,
  })
  return at.toJwt()
}

export interface MeetingRow {
  id: string
  code: string
  host_user_id: string
  host_name: string | null
  company_id: string | null
  title: string | null
  active: boolean
  created_at: string
  expires_at: string | null
  ended_at: string | null
  scheduled_at: string | null
  transcript_status: string | null
  summary: unknown | null
}

// Encerra a sala no LiveKit (desconecta todos e dispara o webhook room_finished)
export async function deleteLiveKitRoom(code: string): Promise<void> {
  try {
    const svc = new RoomServiceClient(HTTP_URL, API_KEY, API_SECRET)
    await svc.deleteRoom(code)
  } catch { /* sala já fechada/inexistente — ok */ }
}

// Expulsa um participante da sala (host)
export async function removeLiveKitParticipant(code: string, identity: string): Promise<void> {
  const svc = new RoomServiceClient(HTTP_URL, API_KEY, API_SECRET)
  await svc.removeParticipant(code, identity)
}

export async function getMeeting(code: string): Promise<MeetingRow | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/meetings?select=*&code=eq.${encodeURIComponent(code)}&limit=1`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows?.[0] ?? null
}

// Sem limite de tempo: o link só "expira" quando a reunião é encerrada
// (host encerra ou a sala fica vazia → active = false).
export function isExpired(m: MeetingRow): boolean {
  return !m.active
}
