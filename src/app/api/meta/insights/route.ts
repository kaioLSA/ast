import { NextResponse } from 'next/server'

const TOKEN = process.env.META_ACCESS_TOKEN
const STARTSETTE_ACCOUNT = 'act_549337254577555'
const TEST_ACCOUNTS = ['act_1296859628917698'] // CA - START - Alisson 02

const VALID_PERIODS = [
  'today','yesterday','last_7d','last_14d','last_30d',
  'last_60d','last_90d','this_month','last_month','maximum',
]

async function fetchAccountInsights(accountId: string, period: string) {
  const url = `https://graph.facebook.com/v25.0/${accountId}/insights?fields=spend,impressions,clicks,reach,actions&date_preset=${period}&access_token=${TOKEN}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json()
  return json.data?.[0] ?? null
}

async function fetchClientCount(): Promise<number> {
  try {
    const url = `https://graph.facebook.com/v25.0/me/adaccounts?fields=id&limit=100&access_token=${TOKEN}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return 0
    const json = await res.json()
    const accounts: { id: string }[] = json.data ?? []
    return accounts.filter(
      a => a.id !== STARTSETTE_ACCOUNT && !TEST_ACCOUNTS.includes(a.id)
    ).length
  } catch {
    return 0
  }
}

export async function GET(request: Request) {
  if (!TOKEN) {
    return NextResponse.json({ error: 'Token não configurado' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const period = VALID_PERIODS.includes(searchParams.get('period') ?? '')
    ? searchParams.get('period')!
    : 'last_30d'

  const [insightsResult, clientCount] = await Promise.all([
    fetchAccountInsights(STARTSETTE_ACCOUNT, period),
    fetchClientCount(),
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
