import { useMemo } from 'react'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useBloomoraProfile } from '@/hooks/useBloomoraProfile'
import {
  formatProfileGreeting,
  profileFirstName,
} from '@/lib/profileAvatarSrc'
import { mockProfileFirstName } from '@/data/dashboardMock'
import { cn } from '@/utils/cn'

function formatGreetingDate(d: Date) {
  const weekday = d.toLocaleDateString('es-CO', { weekday: 'long' })
  const day = d.getDate()
  const month = d.toLocaleDateString('es-CO', { month: 'long' })
  const capWeek =
    weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${capWeek}, ${day} de ${month}`
}

type DashboardGreetingProps = {
  firstName?: string
  title?: string
  subtitle?: string
  className?: string
}

/**
 * Saludo o título de página fuera del navbar (mismo ancho que el grid).
 */
export function DashboardGreeting({
  firstName: firstNameProp,
  title,
  subtitle,
  className,
}: DashboardGreetingProps) {
  const { phone } = useUserPhone()
  const { data: profile } = useBloomoraProfile(phone)

  const displayName =
    firstNameProp != null && String(firstNameProp).trim() !== ''
      ? formatProfileGreeting(String(firstNameProp), mockProfileFirstName)
      : profileFirstName(profile ?? undefined, mockProfileFirstName)

  const dateLabel = useMemo(() => formatGreetingDate(new Date()), [])

  const heading = title ?? `Hola, ${displayName} 👋`
  const sub = subtitle ?? dateLabel

  return (
    <header
      className={cn(
        'flex flex-col items-start gap-1 pb-4 pt-6 max-[599px]:pb-4 max-[599px]:pt-6 min-[600px]:pb-6 min-[600px]:pt-8 min-[1024px]:pb-6 min-[1024px]:pt-10',
        className,
      )}
    >
      <h1 className="text-[1.625rem] font-bold tracking-tight text-bloomora-deep max-[599px]:text-[1.625rem] min-[600px]:text-[1.75rem] min-[1024px]:text-[2rem]">
        {heading}
      </h1>
      <p className="text-[0.9375rem] font-medium text-bloomora-violet min-[1024px]:text-[1.0625rem]">
        {sub}
      </p>
    </header>
  )
}
