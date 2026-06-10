import { promises as fs } from 'fs'
import path from 'path'

// Pasta de gravações montada no container (volume → /docker/livekit/recordings na VPS)
const RECORDINGS_DIR = process.env.RECORDINGS_DIR ?? '/recordings'

// só códigos no formato xxx-xxxx-xxx — nunca apaga nada fora da pasta
const CODE_RE = /^[a-z0-9][a-z0-9-]{1,40}$/i

// Apaga os arquivos de áudio de uma reunião do disco. Retorna false se não havia nada.
export async function deleteRecordingFiles(code: string): Promise<boolean> {
  if (!CODE_RE.test(code)) return false
  const dir = path.join(RECORDINGS_DIR, code)
  try {
    await fs.access(dir)
  } catch {
    return false // pasta não existe (nada gravado ou já limpo)
  }
  try {
    await fs.rm(dir, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

// Lista as pastas de gravação existentes no disco (uma por reunião)
export async function listRecordingDirs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(RECORDINGS_DIR, { withFileTypes: true })
    return entries.filter(e => e.isDirectory()).map(e => e.name)
  } catch {
    return [] // pasta não montada (ex.: ambiente local) — ignora
  }
}
