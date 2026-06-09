// Helper para transcrever áudios via serviço Whisper local na VPS.
// O serviço expõe POST /transcribe recebendo { audio_base64 } e devolve { text }.
import http from 'http'
import https from 'https'

const WHISPER_URL = process.env.WHISPER_API_URL ?? 'http://127.0.0.1:9000'

export interface WhisperSegment { start: number; end: number; text: string }

/** Transcreve um arquivo (path no host) em segmentos com tempo. */
export async function transcribeSegments(filePath: string): Promise<WhisperSegment[]> {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${WHISPER_URL}/transcribe_segments`)
      const isHttps = url.protocol === 'https:'
      const transport = isHttps ? https : http
      const payload = JSON.stringify({ path: filePath })
      const req = transport.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          timeout: 280000,
        },
        (res) => {
          let data = ''
          res.on('data', (c) => (data += c))
          res.on('end', () => {
            try {
              const json = JSON.parse(data)
              resolve(Array.isArray(json.segments) ? json.segments : [])
            } catch { resolve([]) }
          })
        },
      )
      req.on('error', () => resolve([]))
      req.on('timeout', () => { req.destroy(); resolve([]) })
      req.write(payload)
      req.end()
    } catch { resolve([]) }
  })
}

/** Transcreve um áudio (base64, sem prefixo data:) para texto em português. */
export async function transcribeAudio(audioBase64: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${WHISPER_URL}/transcribe`)
      const isHttps = url.protocol === 'https:'
      const transport = isHttps ? https : http
      const payload = JSON.stringify({ audio_base64: audioBase64 })

      const req = transport.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          timeout: 120000,
        },
        (res) => {
          let data = ''
          res.on('data', (c) => (data += c))
          res.on('end', () => {
            try {
              const json = JSON.parse(data)
              resolve(typeof json.text === 'string' ? json.text.trim() : '')
            } catch {
              resolve('')
            }
          })
        },
      )
      req.on('error', () => resolve(''))
      req.on('timeout', () => { req.destroy(); resolve('') })
      req.write(payload)
      req.end()
    } catch {
      resolve('')
    }
  })
}
