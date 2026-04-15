import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { BloomoraToastProvider } from '@/contexts/BloomoraToastContext'
import { UserPhoneProvider } from '@/contexts/UserPhoneContext'
import { BloomoraThemeSync } from '@/theme/BloomoraThemeSync'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <BloomoraToastProvider>
        <UserPhoneProvider>
          <BloomoraThemeSync />
          {children}
        </UserPhoneProvider>
      </BloomoraToastProvider>
    </QueryClientProvider>
  )
}
