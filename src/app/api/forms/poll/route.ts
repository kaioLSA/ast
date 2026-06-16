import { NextResponse } from 'next/server'
import { evoFetch } from '@/lib/utils/evo-fetch'
import { getPageToken, listPageForms, getForm, parseLead, buildLeadMessage } from '@/lib/utils/meta-lead'
import fs from 'fs'
import path from 'path'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE ?? ''
const WA_GROUP_ID  = '120363407832868715@g.us'
const POLL_SECRET  = process.env.POLL_SECRET ?? 'poll-startsette-2024'
const GRAPH        = 'https://graph.facebook.com/v19.0'

// Estado de dedup num diretório PERSISTENTE (volume), não em /tmp — senão o deploy
// recria o container, zera o arquivo e todos os leads antigos seriam reenviados.
const DATA_DIR      = process.env.LEADS_DATA_DIR ?? '/app/data'
const NOTIFIED_FILE = path.join(DATA_DIR, '.notified-leads.json')

function loadNotified(): Set<string> {
  try {
    const data = fs.readFileSync(NOTIFIED_FILE, 'utf-8')
    return new Set(JSON.parse(data))
  } catch {
    return new Set()
  }
}

function saveNotified(ids: Set<string>) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(NOTIFIED_FILE, JSON.stringify([...ids]), 'utf-8')
  } catch (err) {
    console.error('[Forms Poll] Falha ao salvar estado de notificados:', err)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== POLL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pageToken = await getPageToken()
    if (!pageToken) return NextResponse.json({ error: 'No page token' }, { status: 500 })

    // Cold start = não existe estado salvo ainda (1º deploy com volume, ou estado perdido).
    // Nesse caso NÃO enviamos nada: só marcamos os leads atuais como "já notificados",
    // para nunca disparar os antigos no WhatsApp. Só leads que chegarem DEPOIS serão enviados.
    const coldStart = !fs.existsSync(NOTIFIED_FILE)

    const notified = loadNotified()
    let newCount = 0
    let seeded = 0

    // Descobre TODOS os formulários da página (inclui versões novas automaticamente)
    const forms = await listPageForms(pageToken)

    for (const { id } of forms) {
      // Nome + perguntas (com tipos) da versão atual desse formulário
      const { name, questions } = await getForm(id, pageToken)

      const res = await fetch(
        `${GRAPH}/${id}/leads?fields=id,field_data,created_time&limit=20&access_token=${pageToken}`
      )
      if (!res.ok) continue
      const data = await res.json()

      for (const lead of data.data ?? []) {
        if (notified.has(lead.id)) continue

        if (coldStart) {
          notified.add(lead.id) // semeia sem enviar
          seeded++
          continue
        }

        const parsed = parseLead(lead.field_data ?? [], questions)
        await evoFetch.post(`/message/sendText/${EVO_INSTANCE}`, {
          number: WA_GROUP_ID,
          text: buildLeadMessage(parsed, name, lead.created_time),
        })

        notified.add(lead.id)
        newCount++
        console.log(`[Forms Poll] Notificado — Lead: ${parsed.name} | Form: ${name}`)
      }
    }

    saveNotified(notified)
    if (coldStart) {
      console.log(`[Forms Poll] Cold start: ${seeded} leads existentes marcados como notificados (sem envio).`)
    }
    return NextResponse.json({ ok: true, new: newCount, seeded: coldStart ? seeded : 0 })
  } catch (err) {
    console.error('[Forms Poll] Erro:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
