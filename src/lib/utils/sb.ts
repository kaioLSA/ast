// Helper server-side para o Supabase REST usando a service role key.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const SB_URL = SUPABASE_URL
export const SB_KEY = SERVICE_KEY

export function sbHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

/** SELECT — retorna array (vazio em caso de erro). `query` é a parte após a tabela. */
export async function sbSelect<T = Record<string, unknown>>(table: string, query = ''): Promise<T[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`, {
      headers: sbHeaders(),
      cache: 'no-store',
    })
    if (!res.ok) return []
    return (await res.json()) as T[]
  } catch {
    return []
  }
}

/** INSERT — retorna as linhas inseridas. */
export async function sbInsert<T = Record<string, unknown>>(table: string, body: unknown): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase insert ${table} failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as T[]
}

/** UPSERT — insere ou atualiza com base em colunas de conflito. */
export async function sbUpsert<T = Record<string, unknown>>(
  table: string, body: unknown, onConflict: string,
): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase upsert ${table} failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as T[]
}

/** PATCH — atualiza linhas que casam com `filter`. */
export async function sbPatch<T = Record<string, unknown>>(table: string, filter: string, body: unknown): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase patch ${table} failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as T[]
}

/** DELETE — remove linhas que casam com `filter`. */
export async function sbDelete(table: string, filter: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: sbHeaders(),
  })
  if (!res.ok) throw new Error(`Supabase delete ${table} failed: ${res.status} ${await res.text()}`)
}
