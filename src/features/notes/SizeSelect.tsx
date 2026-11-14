import { NOTE_FONT_SIZE_OPTIONS } from '@/features/notes/noteFontUtils'
import { cn } from '@/utils/cn'

export function SizeSelect({
  value,
  onChange,
  onStep,
  onPointerDown,
  variant = 'default',
}: {
  value: number
  onChange: (size: number) => void
  onStep: (direction: -1 | 1) => void
  onPointerDown?: () => void
  variant?: 'default' | 'toolbar'
}) {
  const toolbar = variant === 'toolbar'
  const known = NOTE_FONT_SIZE_OPTIONS.includes(value as (typeof NOTE_FONT_SIZE_OPTIONS)[number])

  return (
    <div
      className={cn(
        toolbar
          ? 'note-toolbar-size'
          : 'inline-flex h-9 items-center gap-0.5 rounded-lg border border-[color:var(--bloomora-border)] bg-[color:var(--bloomora-surface-1)] p-0.5',
      )}
    >
      <button
        type="button"
        aria-label="Reducir tamaño de fuente"
        title="Reducir tamaño"
        onPointerDown={onPointerDown}
        onClick={() => onStep(-1)}
        className={toolbar ? undefined : 'flex size-8 items-center justify-center rounded-md text-sm font-bold text-bloomora-violet hover:bg-[color:var(--bloomora-surface-3)]'}
      >
        {toolbar ? '−' : 'A−'}
      </button>
      <label className="sr-only" htmlFor="note-font-size-select">Tamaño de fuente en píxeles</label>
      <select
        id="note-font-size-select"
        aria-label={`Tamaño de fuente actual: ${value} px`}
        title="Tamaño de fuente"
        value={known ? value : ''}
        onPointerDown={onPointerDown}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          !toolbar && 'h-8 min-w-[3.25rem] rounded-md border-0 bg-transparent px-1 text-center text-xs font-semibold text-bloomora-deep outline-none focus:ring-2 focus:ring-bloomora-lilac/50',
          !known && !toolbar && 'text-bloomora-violet',
        )}
      >
        {!known ? <option value="">{value}</option> : null}
        {NOTE_FONT_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      <button
        type="button"
        aria-label="Aumentar tamaño de fuente"
        title="Aumentar tamaño"
        onPointerDown={onPointerDown}
        onClick={() => onStep(1)}
        className={toolbar ? undefined : 'flex size-8 items-center justify-center rounded-md text-sm font-bold text-bloomora-violet hover:bg-[color:var(--bloomora-surface-3)]'}
      >
        {toolbar ? '+' : 'A+'}
      </button>
    </div>
  )
}
