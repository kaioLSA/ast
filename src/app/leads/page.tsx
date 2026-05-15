import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Leads' }

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Gerencie seu pipeline de vendas"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leads' }]}
        actions={
          <Button variant="glow">
            <Plus className="w-4 h-4" />
            Novo Lead
          </Button>
        }
      />
    </div>
  )
}
