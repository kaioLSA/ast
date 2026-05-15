import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reports' }

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>
    </div>
  )
}
