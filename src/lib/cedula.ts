/** Solo dígitos para cédula / documento. */
export function normalizeCedula(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Longitud típica documento CO y similares (6–12 dígitos). */
export function isValidCedula(digits: string): boolean {
  return digits.length >= 6 && digits.length <= 12
}
