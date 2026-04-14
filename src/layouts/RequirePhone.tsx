import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserPhone } from '@/contexts/UserPhoneContext'

/**
 * Redirige a /entrar (cédula o celular) si no hay sesión por celular en localStorage.
 */
export function RequirePhone({ children }: { children: ReactNode }) {
  const { phone, cedula, sessionReady } = useUserPhone()
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionReady) return
    if (!phone || !cedula) navigate('/entrar', { replace: true })
  }, [phone, cedula, sessionReady, navigate])

  if (!sessionReady || !phone || !cedula) return null
  return <>{children}</>
}
