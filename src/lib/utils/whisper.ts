// Helper para transcrever áudios via serviço Whisper local na VPS.
// O serviço expõe POST /transcribe recebendo { audio_base64 } e devolve { text }.
import http from 'http'
import https from 'https'

const WHISPER_URL = process.env.WHISPER_API_URL ?? 'http://127.0.0.1:9000'

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
