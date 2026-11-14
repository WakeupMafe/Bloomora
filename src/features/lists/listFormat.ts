export function listProgressPct(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((done / total) * 100)
}

export function formatListUpdatedLabel(updatedAt: string | null | undefined): string {
  if (!updatedAt) return ''
  const d = new Date(updatedAt)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round(
    (startToday.getTime() - startThat.getTime()) / 86_400_000,
  )
  if (diffDays <= 0) return 'actualizada hoy'
  if (diffDays === 1) return 'actualizada ayer'
  if (diffDays < 7) return `actualizada hace ${diffDays} días`
  return `actualizada el ${d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })}`
}

export const LIST_IDEA_PRESETS = [
  { emoji: '🛒', label: 'Compras', title: 'Compras' },
  { emoji: '✈️', label: 'Viaje', title: 'Viaje' },
  { emoji: '📖', label: 'Lecturas', title: 'Libros por leer' },
  { emoji: '🎁', label: 'Regalos', title: 'Regalos' },
  { emoji: '🍳', label: 'Recetas', title: 'Recetas' },
  { emoji: '🏠', label: 'Hogar', title: 'Hogar' },
] as const
