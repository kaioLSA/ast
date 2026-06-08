import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { DEMO_META_INSIGHTS } from '@/lib/demo/data'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const TEST_ACCOUNTS = ['act_1296859628917698'] // CA - START - Alisson 02

const VALID_PERIODS = [
  'today','yesterday','last_7d','last_14d','last_30d',
  'last_60d','last_90d','this_month','last_month','maximum',
]

/** Read meta_access_token and meta_ad_account_id from the company record */
async function getCompanyMetaConfig(companyId: string): Promise<{ token: string; accountId: string } | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?select=meta_access_token,meta_ad_account_id&id=eq.${companyId}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY!,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    const rows = await res.json()
    const row = rows?.[0]
    if (!row?.meta_access_token) return null
    return {
      token: row.meta_access_token,
      accountId: row.meta_ad_account_id ?? process.env.META_AD_ACCOUNT_ID ?? 'act_549337254577555',
    }
  } catch {
    return null
  }
}

async function fetchAccountInsights(accountId: string, token: string, period: string) {
  const url = `https://graph.facebook.com/v25.0/${accountId}/insights?fields=spend,impressions,clicks,reach,actions&date_preset=${period}&access_token=${token}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[meta/insights] fetchAccountInsights error:', JSON.stringify(err))
    return null
  }
  const json = await res.json()
  return json.data?.[0] ?? null
}

async function fetchClientCount(token: string, ownAccountId: string): Promise<number> {
  try {
    const url = `https://graph.facebook.com/v25.0/me/adaccounts?fields=id&limit=100&access_token=${token}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return 0
    const json = await res.json()
    const accounts: { id: string }[] = json.data ?? []
    return accounts.filter(
      a => a.id !== ownAccountId && !TEST_ACCOUNTS.includes(a.id)
    ).length
  } catch {
    return 0
  }
}

export async function GET(request: Request) {
  // Resolve token: prefer company DB value, fall back to env var
  const user = await getAuthUser()
  let token = process.env.META_ACCESS_TOKEN ?? ''
  let accountId = process.env.META_AD_ACCOUNT_ID ?? 'act_549337254577555'

  if (user?.is_demo) return NextResponse.json(DEMO_META_INSIGHTS)
  if (user?.company_id) {
    const cfg = await getCompanyMetaConfig(user.company_id)
    if (cfg) {
      token = cfg.token
      accountId = cfg.accountId
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Token Meta não configurado' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const period = VALID_PERIODS.includes(searchParams.get('period') ?? '')
    ? searchParams.get('period')!
    : 'last_30d'

  const [insightsResult, clientCount] = await Promise.all([
    fetchAccountInsights(accountId, token, period),
    fetchClientCount(token, accountId),
  ])

  let totalSpend = 0
  let totalImpressions = 0
  let totalClicks = 0
  let totalReach = 0
  let totalLeads = 0
  let totalMessages = 0

  if (insightsResult) {
    const d = insightsResult
    totalSpend = parseFloat(d.spend ?? '0')
    totalImpressions = parseInt(d.impressions ?? '0')
    totalClicks = parseInt(d.clicks ?? '0')
    totalReach = parseInt(d.reach ?? '0')

    const actions: { action_type: string; value: string }[] = d.actions ?? []
    actions.forEach(a => {
      if (a.action_type === 'lead') totalLeads += parseInt(a.value)
      if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') {
        totalMessages += parseInt(a.value)
      }
    })
  }

  const leadCount = totalLeads > 0 ? totalLeads : totalMessages
  const cpl = leadCount > 0 ? totalSpend / leadCount : null
  const cac = clientCount > 0 ? totalSpend / clientCount : null
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0

  return NextResponse.json({
    period,
    totalSpend,
    totalImpressions,
    totalClicks,
    totalReach,
    totalLeads,
    totalMessages,
    leadCount,
    clientCount,
    cpl,
    cac,
    ctr: parseFloat(ctr.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    cpm: parseFloat(cpm.toFixed(2)),
    activeAccounts: totalSpend > 0 ? 1 : 0,
  })
}
