import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { SocketProvider } from '@/providers/SocketProvider'
import { AnimationProvider } from '@/providers/AnimationProvider'
import { AuthContextProvider } from '@/context/auth.context'
import { SidebarProvider } from '@/context/sidebar.context'
import { NotificationProvider } from '@/context/notification.context'
import { SplashProvider } from '@/components/providers/SplashProvider'
import { siteConfig } from '@/config/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: { icon: '/st.png', apple: '/st.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen mesh-bg antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <AuthContextProvider>
                <SocketProvider>
                  <NotificationProvider>
                    <SidebarProvider>
                      <AnimationProvider>
                        <SplashProvider>
                          {children}
                        </SplashProvider>
                        <Toaster richColors position="top-right" />
                      </AnimationProvider>
                    </SidebarProvider>
                  </NotificationProvider>
                </SocketProvider>
              </AuthContextProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
