/**
 * Helper to call the Evolution API from server-side routes.
 * Uses Node's https.request with rejectUnauthorized:false to handle
 * self-signed / mis-matched SSL certs on the Evolution API host.
 */
import https from 'https'
import http from 'http'

const EVO_URL = process.env.EVOLUTION_API_URL ?? ''
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? ''

function request(method: string, path: string, body?: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${EVO_URL}${path}`)
    const isHttps = url.protocol === 'https:'
    const transport = isHttps ? https : http

    const payload = body ? JSON.stringify(body) : undefined
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        apikey: EVO_KEY,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      rejectUnauthorized: false, // allow self-signed SSL on Evolution API host
    }

    const req = transport.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(data)
        }
      })
    })

    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

export const evoFetch = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: unknown) => request('POST', path, body),
  delete: (path: string) => request('DELETE', path),
}
