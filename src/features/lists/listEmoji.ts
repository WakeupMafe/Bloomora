const STORAGE_KEY = 'bloomora.listEmojis.v1'

const KEYWORD_EMOJI: Array<{ re: RegExp; emoji: string }> = [
  { re: /compra|super|mercado|grocery|tienda/i, emoji: '🛒' },
  { re: /viaje|viaje|viaje|trip|cartagena|vuelo|avion|avión/i, emoji: '🧳' },
  { re: /libro|leer|lectura|reading/i, emoji: '📚' },
  { re: /regalo|navidad|gift/i, emoji: '🎁' },
  { re: /receta|cocina|comida|recipe/i, emoji: '🍳' },
  { re: /hogar|casa|home/i, emoji: '🏠' },
  { re: /trabajo|work|oficina/i, emoji: '💼' },
  { re: /salud|gym|deporte|ejercicio/i, emoji: '💪' },
]

const FALLBACK = ['📝', '✨', '📦', '🌸', '💜', '📌'] as const

const EMOJI_PICKER = [
  '🛒',
  '🧳',
  '📚',
  '🎁',
  '🍳',
  '🏠',
  '💼',
  '💪',
  '📝',
  '✨',
  '📦',
  '🌸',
  '✈️',
  '📖',
  '🎯',
  '🧹',
] as const

export const LIST_EMOJI_OPTIONS = EMOJI_PICKER

function readMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

export function heuristicListEmoji(title: string, index = 0): string {
  for (const { re, emoji } of KEYWORD_EMOJI) {
    if (re.test(title)) return emoji
  }
  return FALLBACK[index % FALLBACK.length]!
}

export function getListEmoji(listId: string, title: string, index = 0): string {
  if (typeof window === 'undefined') return heuristicListEmoji(title, index)
  const map = readMap()
  return map[listId] ?? heuristicListEmoji(title, index)
}

export function setListEmoji(listId: string, emoji: string) {
  const map = readMap()
  map[listId] = emoji
  writeMap(map)
}

export function clearListEmoji(listId: string) {
  const map = readMap()
  if (!(listId in map)) return
  delete map[listId]
  writeMap(map)
}
