import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import { BloomoraAlertProvider } from '@/contexts/BloomoraAlertContext'
import { BloomoraToastProvider } from '@/contexts/BloomoraToastContext'
import { UserPhoneProvider } from '@/contexts/UserPhoneContext'
import { BloomoraThemeSync } from '@/theme/BloomoraThemeSync'
import { registerAgendaBlockSoundUnlock } from '@/utils/agendaBlockSound'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    registerAgendaBlockSoundUnlock()
  }, [])

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
        <BloomoraAlertProvider>
          <UserPhoneProvider>
            <BloomoraThemeSync />
            {children}
          </UserPhoneProvider>
        </BloomoraAlertProvider>
      </BloomoraToastProvider>
    </QueryClientProvider>
  )
}
