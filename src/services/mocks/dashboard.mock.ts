import type { DashboardAnalytics } from '@/types/analytics.types'

export const mockDashboardAnalytics: DashboardAnalytics = {
  period: '30d',
  metrics: [
    { id: 'revenue', label: 'Receita Total', value: 248500, change: 12.5, trend: 'up', prefix: 'R$' },
    { id: 'leads', label: 'Novos Leads', value: 342, change: 8.2, trend: 'up' },
    { id: 'conversion', label: 'Taxa de Conversão', value: 24.7, change: -2.1, trend: 'down', suffix: '%' },
    { id: 'deals', label: 'Negócios Fechados', value: 47, change: 15.3, trend: 'up' },
    { id: 'avg_ticket', label: 'Ticket Médio', value: 5287, change: 3.8, trend: 'up', prefix: 'R$' },
    { id: 'mrr', label: 'MRR', value: 42300, change: 9.1, trend: 'up', prefix: 'R$' },
  ],
  leadsChart: [
    {
      label: 'Leads',
      color: '#3b82f6',
      data: Array.from({ length: 30 }, (_, i) => ({
        label: `Dia ${i + 1}`,
        value: Math.floor(Math.random() * 20 + 5),
      })),
    },
    {
      label: 'Conversões',
      color: '#10b981',
      data: Array.from({ length: 30 }, (_, i) => ({
        label: `Dia ${i + 1}`,
        value: Math.floor(Math.random() * 8 + 1),
      })),
    },
  ],
  revenueChart: [
    {
      label: 'Receita',
      color: '#8b5cf6',
      data: [
        { label: 'Jan', value: 32000 },
        { label: 'Fev', value: 28500 },
        { label: 'Mar', value: 41200 },
        { label: 'Abr', value: 38700 },
        { label: 'Mai', value: 52100 },
        { label: 'Jun', value: 48300 },
      ],
    },
  ],
  conversionFunnel: {
    totalConversions: 47,
    overallRate: 13.7,
    stages: [
      { name: 'Leads', count: 342, value: 0, conversionRate: 100 },
      { name: 'Contactados', count: 218, value: 0, conversionRate: 63.7 },
      { name: 'Qualificados', count: 142, value: 0, conversionRate: 41.5 },
      { name: 'Proposta', count: 89, value: 248500, conversionRate: 26.0 },
      { name: 'Fechados', count: 47, value: 248500, conversionRate: 13.7 },
    ],
  },
  sourceBreakdown: [
    { source: 'Meta Ads', count: 124, percentage: 36.3, value: 98400, color: '#3b82f6' },
    { source: 'Google Ads', count: 87, percentage: 25.4, value: 72100, color: '#10b981' },
    { source: 'WhatsApp', count: 62, percentage: 18.1, value: 34200, color: '#22c55e' },
    { source: 'Orgânico', count: 41, percentage: 12.0, value: 28800, color: '#8b5cf6' },
    { source: 'Outros', count: 28, percentage: 8.2, value: 15000, color: '#f59e0b' },
  ],
  activityHeatmap: Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({
      day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day],
      hour,
      value: Math.floor(Math.random() * 10),
    })),
  ).flat(),
}
