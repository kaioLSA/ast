import type { ID, Timestamp } from './global.types'

export type TransactionType = 'income' | 'expense' | 'refund' | 'transfer'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'unpaid'

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Transaction {
  id: ID
  type: TransactionType
  status: TransactionStatus
  amount: number
  currency: string
  description: string
  category?: string
  reference?: string
  stripeId?: string
  metadata?: Record<string, unknown>
  createdAt: Timestamp
}

export interface Invoice {
  id: ID
  number: string
  status: InvoiceStatus
  amount: number
  currency: string
  dueDate: Timestamp
  paidAt?: Timestamp
  clientName: string
  clientEmail: string
  items: InvoiceItem[]
  stripeId?: string
  createdAt: Timestamp
}

export interface InvoiceItem {
  id: ID
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Subscription {
  id: ID
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: Timestamp
  currentPeriodEnd: Timestamp
  cancelAtPeriodEnd: boolean
  trialEnd?: Timestamp
  amount: number
  currency: string
  stripeId?: string
}

export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  mrr: number
  arr: number
  growthRate: number
  pendingInvoices: number
  overdueInvoices: number
}

export interface RevenueChart {
  period: string
  revenue: number
  expenses: number
  profit: number
}
