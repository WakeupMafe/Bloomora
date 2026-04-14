const STORAGE_KEY = 'bloomora:numero_celular'
const CEDULA_STORAGE_KEY = 'bloomora:cedula'

/** Solo dígitos, mínimo 10 (Colombia móvil típico sin +57). */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function isValidPhone(digits: string): boolean {
  return digits.length >= 10 && digits.length <= 15
}

export function getStoredPhone(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (!v) return null
    const n = normalizePhone(v)
    return n.length >= 10 ? n : null
  } catch {
    return null
  }
}

export function setStoredPhone(digits: string): void {
  localStorage.setItem(STORAGE_KEY, digits)
}

export function clearStoredPhone(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getStoredCedula(): string | null {
  try {
    const v = localStorage.getItem(CEDULA_STORAGE_KEY)
    const t = v?.trim()
    return t && t.length >= 6 ? t : null
  } catch {
    return null
  }
}

export function setStoredCedula(cedula: string): void {
  localStorage.setItem(CEDULA_STORAGE_KEY, cedula.trim())
}

export function clearStoredCedula(): void {
  localStorage.removeItem(CEDULA_STORAGE_KEY)
}
