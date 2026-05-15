import { Sidebar } from '@/components/layout/sidebar/Sidebar'
import { Topbar } from '@/components/layout/topbar/Topbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#04070f]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-[#04070f]">{children}</main>
      </div>
    </div>
  )
}
