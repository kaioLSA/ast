import { EgressClient, WebhookReceiver, DirectFileOutput } from 'livekit-server-sdk'

const API_KEY = process.env.LIVEKIT_API_KEY ?? ''
const API_SECRET = process.env.LIVEKIT_API_SECRET ?? ''
const HTTP_URL = (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '')
  .replace(/^wss:/, 'https:')
  .replace(/^ws:/, 'http:')

export const egressClient = new EgressClient(HTTP_URL, API_KEY, API_SECRET)
export const webhookReceiver = new WebhookReceiver(API_KEY, API_SECRET)

// Inicia gravação (egress) de UMA faixa de áudio → arquivo .ogg na pasta compartilhada
export async function startAudioTrackEgress(room: string, trackSid: string, filepath: string) {
  const output = new DirectFileOutput({ filepath })
  return egressClient.startTrackEgress(room, output, trackSid)
}
