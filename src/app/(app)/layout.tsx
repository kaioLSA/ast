import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import { Topbar } from '@/components/layout/topbar/Topbar'
import { WhatsAppNotifier } from '@/components/providers/WhatsAppNotifier'
import { PageTransition } from '@/components/layout/PageTransition'
import { AuthGuard } from '@/components/providers/AuthGuard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[#0b0b0f]">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 bg-[#0b0b0f]">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        {/* Global WhatsApp poller — runs on all pages */}
        <WhatsAppNotifier />
      </div>
    </AuthGuard>
  )
}
