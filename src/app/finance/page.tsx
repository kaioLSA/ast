import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Finance' }

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finance</h1>
      </div>
    </div>
  )
}
