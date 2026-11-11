import { cn } from '@/utils/cn'
import type { NoteParagraphStyle } from '@/features/notes/noteTypingDefaults'

export type { NoteParagraphStyle } from '@/features/notes/noteTypingDefaults'

const OPTIONS: Array<{ id: NoteParagraphStyle; label: string }> = [
  { id: 'p', label: 'Texto normal' },
  { id: 'h1', label: 'Título 1' },
  { id: 'h2', label: 'Título 2' },
  { id: 'h3', label: 'Título 3' },
]

export function HeadingSelect({
  value,
  onChange,
  onPointerDown,
}: {
  value: NoteParagraphStyle
  onChange: (style: NoteParagraphStyle) => void
  onPointerDown?: () => void
}) {
  return (
    <>
      <label className="sr-only" htmlFor="note-paragraph-style">Estilo de párrafo</label>
      <select
        id="note-paragraph-style"
        aria-label="Estilo de párrafo"
        title="Estilo de párrafo"
        value={value}
        onPointerDown={onPointerDown}
        onChange={(event) => onChange(event.target.value as NoteParagraphStyle)}
        className={cn('h-9 max-w-32 rounded-lg border border-bloomora-line/50 bg-white px-2 text-xs text-bloomora-deep outline-none focus:ring-2 focus:ring-bloomora-lilac/50')}
      >
        {OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </>
  )
}
