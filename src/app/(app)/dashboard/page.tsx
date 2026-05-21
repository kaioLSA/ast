import type { Metadata } from 'next'
import { DashboardWrapper } from '@/components/dashboard/DashboardWrapper'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return <DashboardWrapper />
}
