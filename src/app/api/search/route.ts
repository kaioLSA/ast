import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function H() {
  return {
    apikey: KEY!,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }
}

async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { headers: H(), cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ leads: [], clients: [], transactions: [] })

  const encoded = encodeURIComponent(`*${q}*`)
  const cid = user.company_id

  const [leads, clients, transactions, contacts] = await Promise.all([
    safeFetch(
      `${URL}/rest/v1/leads?select=id,name,email,phone,company,status,temperature,value&company_id=eq.${cid}&or=(name.ilike.${encoded},email.ilike.${encoded},phone.ilike.${encoded},company.ilike.${encoded})&limit=6&order=created_at.desc`
    ),
    safeFetch(
      `${URL}/rest/v1/clients?select=id,name,email,phone,company_name,status,value&company_id=eq.${cid}&or=(name.ilike.${encoded},email.ilike.${encoded},phone.ilike.${encoded},company_name.ilike.${encoded})&limit=6&order=created_at.desc`
    ),
    safeFetch(
      `${URL}/rest/v1/financial_transactions?select=id,description,category,amount,type,status,transaction_date&company_id=eq.${cid}&or=(description.ilike.${encoded},category.ilike.${encoded})&limit=5&order=transaction_date.desc`
    ),
    safeFetch(
      `${URL}/rest/v1/whatsapp_contacts?select=id,name,phone&company_id=eq.${cid}&or=(name.ilike.${encoded},phone.ilike.${encoded})&limit=5`
    ),
  ])

  return NextResponse.json({ leads, clients, transactions, contacts })
}
