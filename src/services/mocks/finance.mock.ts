import type { Transaction, FinancialSummary } from '@/types/finance.types'

export const mockFinancialSummary: FinancialSummary = {
  totalRevenue: 248500,
  totalExpenses: 87300,
  netProfit: 161200,
  mrr: 42300,
  arr: 507600,
  growthRate: 12.5,
  pendingInvoices: 8,
  overdueInvoices: 2,
}

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    status: 'completed',
    amount: 5000,
    currency: 'BRL',
    description: 'Assinatura plano Professional - Carlos Mendes',
    category: 'subscription',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '2',
    type: 'income',
    status: 'completed',
    amount: 18500,
    currency: 'BRL',
    description: 'Projeto Varejo Plus - Fase 1',
    category: 'project',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '3',
    type: 'expense',
    status: 'completed',
    amount: 500,
    currency: 'BRL',
    description: 'Meta Ads - Budget diário',
    category: 'ads',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
]
