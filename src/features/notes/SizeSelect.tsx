import { NOTE_FONT_SIZE_OPTIONS } from '@/features/notes/noteFontUtils'
import { cn } from '@/utils/cn'

export function SizeSelect({
  value,
  onChange,
  onStep,
  onPointerDown,
}: {
  value: number
  onChange: (size: number) => void
  onStep: (direction: -1 | 1) => void
  onPointerDown?: () => void
}) {
  return (
    <div className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-bloomora-line/50 bg-white p-0.5">
      <button type="button" aria-label="Reducir tamaño de fuente" title="Reducir tamaño (A−)" onPointerDown={onPointerDown} onClick={() => onStep(-1)} className="flex size-8 items-center justify-center rounded-md text-sm font-bold text-bloomora-violet hover:bg-bloomora-lavender-50">A−</button>
      <label className="sr-only" htmlFor="note-font-size-select">Tamaño de fuente en píxeles</label>
      <select
        id="note-font-size-select"
        aria-label={`Tamaño de fuente actual: ${value} px`}
        title="Tamaño de fuente"
        value={NOTE_FONT_SIZE_OPTIONS.includes(value as (typeof NOTE_FONT_SIZE_OPTIONS)[number]) ? value : ''}
        onPointerDown={onPointerDown}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn('h-8 min-w-[3.25rem] rounded-md border-0 bg-transparent px-1 text-center text-xs font-semibold text-bloomora-deep outline-none focus:ring-2 focus:ring-bloomora-lilac/50', !NOTE_FONT_SIZE_OPTIONS.includes(value as (typeof NOTE_FONT_SIZE_OPTIONS)[number]) && 'text-bloomora-violet')}
      >
        {!NOTE_FONT_SIZE_OPTIONS.includes(value as (typeof NOTE_FONT_SIZE_OPTIONS)[number]) ? <option value="">{value}px</option> : null}
        {NOTE_FONT_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
      </select>
      <button type="button" aria-label="Aumentar tamaño de fuente" title="Aumentar tamaño (A+)" onPointerDown={onPointerDown} onClick={() => onStep(1)} className="flex size-8 items-center justify-center rounded-md text-sm font-bold text-bloomora-violet hover:bg-bloomora-lavender-50">A+</button>
    </div>
  )
}
