import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Campaigns' }

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campaigns</h1>
      </div>
    </div>
  )
}
