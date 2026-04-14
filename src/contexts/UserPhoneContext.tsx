import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearStoredCedula,
  clearStoredPhone,
  getStoredCedula,
  getStoredPhone,
  normalizePhone,
  setStoredCedula,
  setStoredPhone,
} from '@/lib/userPhone'
import { fetchProfile } from '@/services/supabase/profilesRepo'
import { getSupabaseBrowserClient } from '@/services/supabase/client'

export type UserPhoneContextValue = {
  phone: string | null
  /** Identidad de negocio para goals, agenda, listas, marcas. */
  cedula: string | null
  /** true cuando no hay sesión o ya terminó hidratar cédula desde perfil. */
  sessionReady: boolean
  /** Guarda celular + cédula tras registro o ingreso (perfil ya resuelto). */
  setSession: (phoneDigits: string, cedula: string) => void
  logoutPhone: () => void
}

const UserPhoneContext = createContext<UserPhoneContextValue | null>(null)

export function UserPhoneProvider({ children }: { children: ReactNode }) {
  const [phone, setPhoneState] = useState<string | null>(() => getStoredPhone())
  const [cedula, setCedulaState] = useState<string | null>(() => getStoredCedula())
  const [sessionReady, setSessionReady] = useState(() => {
    const p = getStoredPhone()
    if (!p) return true
    return !!getStoredCedula()
  })

  useEffect(() => {
    if (!phone) {
      setCedulaState(null)
      setSessionReady(true)
      return
    }
    const c = getStoredCedula()
    if (c) {
      setCedulaState(c)
      setSessionReady(true)
      return
    }

    let cancelled = false
    setSessionReady(false)
    void (async () => {
      try {
        const sb = getSupabaseBrowserClient()
        if (!sb) {
          if (!cancelled) setSessionReady(true)
          return
        }
        const row = await fetchProfile(sb, phone)
        if (!cancelled && row?.cedula) {
          setStoredCedula(row.cedula)
          setCedulaState(row.cedula)
        }
      } finally {
        if (!cancelled) setSessionReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [phone])

  const setSession = useCallback((phoneDigits: string, ced: string) => {
    const digits = normalizePhone(phoneDigits)
    const doc = ced.trim()
    setStoredPhone(digits)
    setStoredCedula(doc)
    setPhoneState(digits)
    setCedulaState(doc)
  }, [])

  const logoutPhone = useCallback(() => {
    clearStoredPhone()
    clearStoredCedula()
    setPhoneState(null)
    setCedulaState(null)
    setSessionReady(true)
  }, [])

  const value = useMemo(
    () => ({
      phone,
      cedula,
      sessionReady,
      setSession,
      logoutPhone,
    }),
    [phone, cedula, sessionReady, setSession, logoutPhone],
  )

  return (
    <UserPhoneContext.Provider value={value}>
      {children}
    </UserPhoneContext.Provider>
  )
}

export function useUserPhone(): UserPhoneContextValue {
  const ctx = useContext(UserPhoneContext)
  if (!ctx) {
    throw new Error('useUserPhone debe usarse dentro de UserPhoneProvider')
  }
  return ctx
}
