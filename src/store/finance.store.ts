import { create } from 'zustand'
import type { Transaction, Invoice, FinancialSummary } from '@/types/finance.types'

interface FinanceStore {
  transactions: Transaction[]
  invoices: Invoice[]
  summary: FinancialSummary | null
  isLoading: boolean
  setTransactions: (transactions: Transaction[]) => void
  setInvoices: (invoices: Invoice[]) => void
  setSummary: (summary: FinancialSummary) => void
  setLoading: (loading: boolean) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: [],
  invoices: [],
  summary: null,
  isLoading: false,
  setTransactions: (transactions) => set({ transactions }),
  setInvoices: (invoices) => set({ invoices }),
  setSummary: (summary) => set({ summary }),
  setLoading: (isLoading) => set({ isLoading }),
}))
