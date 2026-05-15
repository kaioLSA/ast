import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Team' }

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
      </div>
    </div>
  )
}
