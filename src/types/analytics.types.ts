import type { Timestamp } from './global.types'

export type MetricPeriod = '7d' | '30d' | '90d' | '12m' | 'custom'

export type MetricTrend = 'up' | 'down' | 'stable'

export interface MetricCard {
  id: string
  label: string
  value: number | string
  change: number
  trend: MetricTrend
  prefix?: string
  suffix?: string
  sparkline?: number[]
}

export interface ChartDataPoint {
  label: string
  value: number
  date?: Timestamp
}

export interface MultiSeriesChartData {
  label: string
  data: ChartDataPoint[]
  color?: string
}

export interface FunnelStage {
  name: string
  count: number
  value: number
  conversionRate: number
}

export interface ConversionFunnel {
  stages: FunnelStage[]
  totalConversions: number
  overallRate: number
}

export interface HeatmapData {
  day: string
  hour: number
  value: number
}

export interface SourceBreakdown {
  source: string
  count: number
  percentage: number
  value: number
  color: string
}

export interface DashboardAnalytics {
  metrics: MetricCard[]
  leadsChart: MultiSeriesChartData[]
  revenueChart: MultiSeriesChartData[]
  conversionFunnel: ConversionFunnel
  sourceBreakdown: SourceBreakdown[]
  activityHeatmap: HeatmapData[]
  period: MetricPeriod
}
