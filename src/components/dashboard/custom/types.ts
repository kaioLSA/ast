export type WidgetType = 'metric' | 'bar' | 'line' | 'donut' | 'map' | 'list'

export interface DBWidget {
  id: string
  dashboard_id: string
  position: number
  widget_type: WidgetType
  data_source: string
  title: string
  color: string      // hex e.g. '#3b82f6'
  col_span: 3 | 6 | 9 | 12
  tall: boolean
  merged: boolean
  config: Record<string, unknown>
  created_at: string
}

export interface DBDashboard {
  id: string
  company_id: string
  name: string
  created_at: string
}

// ── Data shapes returned by /api/dashboard-data ─────────────────────────────

export type MetricData  = { value: number; label: string; format?: 'number' | 'currency' }
export type SeriesItem  = { name: string; value: number }
export type TimeItem    = { month: string; income: number; expenses: number }
export type StateMap    = Record<string, number>

// ── Available data sources config ────────────────────────────────────────────

export interface DataSourceDef {
  key: string
  label: string
  compatibleTypes: WidgetType[]
  description: string
}

export const DATA_SOURCES: DataSourceDef[] = [
  // Leads
  { key: 'leads_total',       label: 'Total de Leads',           compatibleTypes: ['metric'],             description: 'Número total de leads' },
  { key: 'leads_hot',         label: 'Leads Quentes',            compatibleTypes: ['metric'],             description: 'Leads com temperatura quente' },
  { key: 'leads_score_avg',   label: 'Score Médio',              compatibleTypes: ['metric'],             description: 'Score médio dos leads' },
  { key: 'leads_by_status',   label: 'Leads por Status',         compatibleTypes: ['bar', 'donut', 'list'], description: 'Leads agrupados por status' },
  { key: 'leads_by_source',   label: 'Leads por Origem',         compatibleTypes: ['bar', 'donut', 'list'], description: 'Leads agrupados por origem' },
  { key: 'leads_temperature', label: 'Temperatura dos Leads',    compatibleTypes: ['bar', 'donut'],       description: 'Distribuição por temperatura' },
  { key: 'leads_by_state',    label: 'Leads por Estado (Mapa)',  compatibleTypes: ['map'],                description: 'Mapa do Brasil com leads por estado' },
  // Clients
  { key: 'clients_total',     label: 'Total de Clientes',        compatibleTypes: ['metric'],             description: 'Número total de clientes' },
  // Finance
  { key: 'revenue_total',     label: 'Receita Total',            compatibleTypes: ['metric'],             description: 'Soma de todas as receitas' },
  { key: 'expenses_total',    label: 'Total de Despesas',        compatibleTypes: ['metric'],             description: 'Soma de todas as despesas' },
  { key: 'net_balance',       label: 'Saldo Líquido',            compatibleTypes: ['metric'],             description: 'Receitas menos despesas' },
  { key: 'transactions_count',label: 'Nº de Transações',         compatibleTypes: ['metric'],             description: 'Total de transações registradas' },
  { key: 'revenue_by_category',label: 'Receita por Categoria',   compatibleTypes: ['bar', 'donut'],       description: 'Receitas agrupadas por categoria' },
  { key: 'revenue_over_time', label: 'Receita ao Longo do Tempo',compatibleTypes: ['line'],               description: 'Receita vs Despesa nos últimos 6 meses' },
]

export const WIDGET_TYPES: { key: WidgetType; label: string; icon: string; desc: string }[] = [
  { key: 'metric', label: 'Métrica', icon: 'Hash',       desc: 'Um número em destaque' },
  { key: 'bar',    label: 'Barras',  icon: 'BarChart2',  desc: 'Gráfico de barras' },
  { key: 'line',   label: 'Linha',   icon: 'TrendingUp', desc: 'Gráfico de linha/área' },
  { key: 'donut',  label: 'Donut',   icon: 'PieChart',   desc: 'Gráfico de rosca' },
  { key: 'map',    label: 'Mapa',    icon: 'MapPin',     desc: 'Mapa do Brasil' },
  { key: 'list',   label: 'Lista',   icon: 'List',       desc: 'Lista rankeada' },
]

export const COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#10b981', '#06b6d4', '#94a3b8',
]

export const GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#6366f1,#a855f7)',
  'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f97316,#ef4444)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#22c55e,#06b6d4)',
  'linear-gradient(135deg,#eab308,#f97316)',
  'linear-gradient(135deg,#ef4444,#ec4899)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#14b8a6,#3b82f6)',
]

export function isGradient(color: string) {
  return color.startsWith('linear-gradient')
}
