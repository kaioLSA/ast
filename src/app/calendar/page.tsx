import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Calendar' }

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>
    </div>
  )
}
