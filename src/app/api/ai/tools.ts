import type { AuthUser } from '@/lib/utils/get-auth-user'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

async function sbGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function sbPost(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function sbPatch(table: string, filter: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ─── Tool executor ────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  user: AuthUser,
): Promise<string> {
  const cid = user.company_id

  try {
    switch (name) {
      // ── Leads ──────────────────────────────────────────────────────────────
      case 'list_leads': {
        const { status, temperature, limit = 20 } = args as {
          status?: string
          temperature?: string
          limit?: number
        }
        let q = `leads?company_id=eq.${cid}&order=created_at.desc&limit=${limit}`
        if (status) q += `&status=eq.${status}`
        if (temperature) q += `&temperature=eq.${temperature}`
        const data = (await sbGet(q)) as Array<Record<string, unknown>>
        if (!data?.length) return 'Nenhum lead encontrado com esses filtros.'
        const lines = data.map(
          l =>
            `• [ID: ${l.id}] ${l.name} | ${l.status} | ${l.temperature ?? '-'} | R$ ${l.value ?? 0}${l.phone ? ` | ${l.phone}` : ''}`,
        )
        return `${data.length} lead(s) encontrado(s):\n${lines.join('\n')}`
      }

      case 'get_lead': {
        const { id, name } = args as { id?: string; name?: string }
        let q = `leads?company_id=eq.${cid}&limit=5`
        if (id) q += `&id=eq.${id}`
        else if (name) q += `&name=ilike.*${encodeURIComponent(name)}*`
        else return 'Informe o ID ou nome do lead.'
        const data = (await sbGet(q)) as Array<Record<string, unknown>>
        if (!data?.length) return 'Lead não encontrado.'
        const l = data[0]
        return [
          `Lead: ${l.name}`,
          `ID: ${l.id}`,
          `Status: ${l.status}`,
          `Temperatura: ${l.temperature}`,
          `Valor: R$ ${l.value ?? 0}`,
          `Telefone: ${l.phone ?? '-'}`,
          `E-mail: ${l.email ?? '-'}`,
          `Origem: ${l.source ?? '-'}`,
          `Notas: ${l.notes ?? '-'}`,
        ].join('\n')
      }

      case 'create_lead': {
        const {
          name,
          phone,
          email,
          source = 'manual',
          status = 'new',
          temperature = 'warm',
          value = 0,
          notes,
        } = args as Record<string, string | number>

        const body = {
          name,
          phone: phone ?? null,
          email: email ?? null,
          source,
          status,
          temperature,
          value: Number(value),
          notes: notes ?? null,
          company_id: cid,
          created_by: user.id,
        }
        const result = (await sbPost('leads', body)) as Array<Record<string, unknown>>
        const lead = result?.[0]
        return `✅ Lead criado com sucesso!\nNome: ${lead?.name ?? name}\nID: ${lead?.id}\nStatus: ${lead?.status}\nTemperatura: ${lead?.temperature}`
      }

      case 'update_lead': {
        const { id, ...fields } = args as Record<string, unknown>
        if (!id) return 'Informe o ID do lead para atualizar.'
        // Remove undefined fields
        const clean = Object.fromEntries(
          Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== ''),
        )
        const result = (await sbPatch(
          'leads',
          `id=eq.${id}&company_id=eq.${cid}`,
          clean,
        )) as Array<Record<string, unknown>>
        const lead = result?.[0]
        return `✅ Lead "${lead?.name ?? id}" atualizado!\nCampos atualizados: ${Object.keys(clean).join(', ')}`
      }

      // ── Clients ────────────────────────────────────────────────────────────
      case 'list_clients': {
        const { limit = 20 } = args as { limit?: number }
        const data = (await sbGet(
          `clients?company_id=eq.${cid}&order=created_at.desc&limit=${limit}`,
        )) as Array<Record<string, unknown>>
        if (!data?.length) return 'Nenhum cliente encontrado.'
        const lines = data.map(
          c =>
            `• [ID: ${c.id}] ${c.name}${c.company_name ? ` (${c.company_name})` : ''} | R$ ${c.value ?? 0}`,
        )
        return `${data.length} cliente(s):\n${lines.join('\n')}`
      }

      case 'create_client': {
        const { name, company_name, phone, email, value = 0 } = args as Record<
          string,
          string | number
        >
        const gradients = [
          'from-blue-500 to-cyan-500',
          'from-violet-500 to-purple-600',
          'from-emerald-500 to-teal-600',
          'from-rose-500 to-pink-600',
          'from-amber-500 to-orange-500',
        ]
        const gradient = gradients[Math.floor(Math.random() * gradients.length)]
        const body = {
          name,
          company_name: company_name ?? null,
          phone: phone ?? null,
          email: email ?? null,
          value: Number(value),
          status: 'prospect',
          deals: 0,
          score: 0,
          gradient,
          since: new Date().toISOString().split('T')[0],
          company_id: cid,
          created_by: user.id,
        }
        const result = (await sbPost('clients', body)) as Array<Record<string, unknown>>
        const client = result?.[0]
        return `✅ Cliente "${client?.name ?? name}" cadastrado com sucesso!\nID: ${client?.id}`
      }

      // ── Calendar ───────────────────────────────────────────────────────────
      case 'list_events': {
        const today = new Date()
        const { month = today.getMonth() + 1, year = today.getFullYear() } = args as {
          month?: number
          year?: number
        }
        const data = (await sbGet(
          `calendar_events?company_id=eq.${cid}&month=eq.${month}&year=eq.${year}&order=day.asc,time.asc`,
        )) as Array<Record<string, unknown>>
        if (!data?.length) return `Nenhum evento encontrado para ${month}/${year}.`
        const lines = data.map(
          e =>
            `• [ID: ${e.id}] ${String(e.day).padStart(2, '0')}/${month}/${year} às ${e.time} — ${e.label}${e.description ? ` (${e.description})` : ''}`,
        )
        return `Eventos em ${month}/${year}:\n${lines.join('\n')}`
      }

      case 'create_event': {
        const { label, day, month, year, time, color = 'blue', description } = args as Record<
          string,
          string | number
        >
        const body = {
          label,
          day: Number(day),
          month: Number(month),
          year: Number(year),
          time: String(time),
          color: String(color),
          description: description ?? null,
          company_id: cid,
          created_by: user.id,
        }
        const result = (await sbPost('calendar_events', body)) as Array<Record<string, unknown>>
        const event = result?.[0]
        return `✅ Evento "${event?.label ?? label}" criado!\nData: ${day}/${month}/${year} às ${time}${description ? `\nDescrição: ${description}` : ''}`
      }

      case 'delete_event': {
        const { id } = args as { id: string }
        if (!id) return 'Informe o ID do evento.'
        await fetch(
          `${SUPABASE_URL}/rest/v1/calendar_events?id=eq.${id}&company_id=eq.${cid}`,
          { method: 'DELETE', headers: sbHeaders() },
        )
        return `✅ Evento removido da agenda.`
      }

      default:
        return `Ferramenta desconhecida: "${name}"`
    }
  } catch (err) {
    return `❌ Erro ao executar "${name}": ${String(err)}`
  }
}

// ─── Tool definitions (Anthropic format) ──────────────────────────────────────
// Anthropic uses { name, description, input_schema } instead of { type, function: { ... } }

export const anthropicTools = [
  {
    name: 'list_leads',
    description: 'Lista leads do CRM com filtros opcionais. Use para buscar, visualizar ou consultar leads existentes.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['new','contacted','qualified','proposal','negotiation','won','lost'], description: 'Filtrar por status' },
        temperature: { type: 'string', enum: ['hot','warm','cold'], description: 'Filtrar por temperatura' },
        limit: { type: 'number', description: 'Quantidade máxima (padrão 20)' },
      },
    },
  },
  {
    name: 'get_lead',
    description: 'Busca detalhes completos de um lead específico pelo ID ou nome.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID do lead' },
        name: { type: 'string', description: 'Nome ou parte do nome do lead' },
      },
    },
  },
  {
    name: 'create_lead',
    description: 'Cria um novo lead no CRM.',
    input_schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Nome completo do lead' },
        phone: { type: 'string', description: 'Telefone/WhatsApp' },
        email: { type: 'string', description: 'E-mail' },
        source: { type: 'string', enum: ['meta_ads','google_ads','whatsapp','organic','referral','manual'] },
        status: { type: 'string', enum: ['new','contacted','qualified','proposal','negotiation','won','lost'] },
        temperature: { type: 'string', enum: ['hot','warm','cold'] },
        value: { type: 'number', description: 'Valor estimado em reais' },
        notes: { type: 'string', description: 'Observações' },
      },
    },
  },
  {
    name: 'update_lead',
    description: 'Atualiza dados de um lead existente pelo ID.',
    input_schema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        status: { type: 'string', enum: ['new','contacted','qualified','proposal','negotiation','won','lost'] },
        temperature: { type: 'string', enum: ['hot','warm','cold'] },
        value: { type: 'number' },
        notes: { type: 'string' },
        source: { type: 'string', enum: ['meta_ads','google_ads','whatsapp','organic','referral','manual'] },
      },
    },
  },
  {
    name: 'list_clients',
    description: 'Lista clientes cadastrados no CRM.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Quantidade máxima (padrão 20)' },
      },
    },
  },
  {
    name: 'create_client',
    description: 'Cadastra um novo cliente no CRM.',
    input_schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        company_name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        value: { type: 'number' },
      },
    },
  },
  {
    name: 'list_events',
    description: 'Lista eventos da agenda de um mês específico.',
    input_schema: {
      type: 'object',
      properties: {
        month: { type: 'number', description: 'Mês (1-12), padrão: mês atual' },
        year: { type: 'number', description: 'Ano, padrão: ano atual' },
      },
    },
  },
  {
    name: 'create_event',
    description: 'Cria um evento na agenda.',
    input_schema: {
      type: 'object',
      required: ['label','day','month','year','time'],
      properties: {
        label: { type: 'string', description: 'Título do evento' },
        day: { type: 'number' },
        month: { type: 'number' },
        year: { type: 'number' },
        time: { type: 'string', description: 'Horário HH:MM' },
        color: { type: 'string', enum: ['blue','green','red','yellow','purple','pink'] },
        description: { type: 'string' },
      },
    },
  },
  {
    name: 'delete_event',
    description: 'Remove um evento da agenda pelo ID.',
    input_schema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string' },
      },
    },
  },
]

// ─── Tool definitions (Ollama format — kept for reference) ────────────────────

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'list_leads',
      description:
        'Lista leads do CRM com filtros opcionais. Use para buscar, visualizar ou consultar leads existentes.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
            description: 'Filtrar por status do lead',
          },
          temperature: {
            type: 'string',
            enum: ['hot', 'warm', 'cold'],
            description: 'Filtrar por temperatura',
          },
          limit: {
            type: 'number',
            description: 'Quantidade máxima de resultados (padrão 20)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_lead',
      description: 'Busca detalhes completos de um lead específico pelo ID ou nome.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID do lead' },
          name: { type: 'string', description: 'Nome (ou parte do nome) do lead para buscar' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_lead',
      description:
        'Cria um novo lead no CRM. Pergunte o nome antes de criar. Telefone, e-mail e demais campos são opcionais.',
      parameters: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Nome completo do lead' },
          phone: { type: 'string', description: 'Telefone/WhatsApp (ex: 11999999999)' },
          email: { type: 'string', description: 'E-mail do lead' },
          source: {
            type: 'string',
            enum: ['meta_ads', 'google_ads', 'whatsapp', 'organic', 'referral', 'manual'],
            description: 'Origem do lead (padrão: manual)',
          },
          status: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
            description: 'Status inicial (padrão: new)',
          },
          temperature: {
            type: 'string',
            enum: ['hot', 'warm', 'cold'],
            description: 'Temperatura do lead (padrão: warm)',
          },
          value: { type: 'number', description: 'Valor estimado do negócio em reais' },
          notes: { type: 'string', description: 'Observações sobre o lead' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_lead',
      description:
        'Atualiza dados de um lead existente. Use o ID retornado por list_leads ou get_lead.',
      parameters: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID do lead a atualizar' },
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          status: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
          },
          temperature: { type: 'string', enum: ['hot', 'warm', 'cold'] },
          value: { type: 'number' },
          notes: { type: 'string' },
          source: {
            type: 'string',
            enum: ['meta_ads', 'google_ads', 'whatsapp', 'organic', 'referral', 'manual'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_clients',
      description: 'Lista clientes cadastrados no CRM.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Quantidade máxima (padrão 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_client',
      description: 'Cadastra um novo cliente no CRM.',
      parameters: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Nome do cliente' },
          company_name: { type: 'string', description: 'Nome da empresa' },
          phone: { type: 'string' },
          email: { type: 'string' },
          value: { type: 'number', description: 'Valor do cliente em reais' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'Lista eventos da agenda/calendário de um mês específico.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'number', description: 'Mês (1-12). Padrão: mês atual.' },
          year: { type: 'number', description: 'Ano (ex: 2025). Padrão: ano atual.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_event',
      description:
        'Cria um evento na agenda. Pergunte o título, data e horário se não foram informados.',
      parameters: {
        type: 'object',
        required: ['label', 'day', 'month', 'year', 'time'],
        properties: {
          label: { type: 'string', description: 'Título do evento' },
          day: { type: 'number', description: 'Dia do mês (1-31)' },
          month: { type: 'number', description: 'Mês (1-12)' },
          year: { type: 'number', description: 'Ano (ex: 2025)' },
          time: { type: 'string', description: 'Horário no formato HH:MM (ex: 14:30)' },
          color: {
            type: 'string',
            enum: ['blue', 'green', 'red', 'yellow', 'purple', 'pink'],
            description: 'Cor do evento (padrão: blue)',
          },
          description: { type: 'string', description: 'Descrição ou observações' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_event',
      description: 'Remove um evento da agenda pelo ID.',
      parameters: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID do evento a remover' },
        },
      },
    },
  },
]
