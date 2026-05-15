'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { QUERY_STALE_TIME, QUERY_CACHE_TIME } from '@/lib/constants/app'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME,
            gcTime: QUERY_CACHE_TIME,
            refetchOnWindowFocus: false,
            retry: (failureCount, error: unknown) => {
              const status = (error as { response?: { status?: number } })?.response?.status
              if (status === 401 || status === 403 || status === 404) return false
              return failureCount < 2
            },
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
