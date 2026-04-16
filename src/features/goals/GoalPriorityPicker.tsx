import type { MockGoalRow } from '@/data/dashboardMock'
import { cn } from '@/utils/cn'

const PRIORITIES: MockGoalRow['prioridad'][] = ['Alta', 'Media', 'Baja']

const segmentBase =
  'bloomora-goal-priority-segment relative z-0 rounded-full px-2 py-1 text-[11px] font-semibold sm:px-2.5 sm:text-xs ' +
  'transform-gpu transition-[transform,background-color,color,box-shadow] duration-200 ease-out ' +
  'will-change-transform hover:z-[1] hover:scale-[1.07] active:scale-[0.96] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bloomora-lilac/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bloomora-snow ' +
  'motion-reduce:transition-colors motion-reduce:hover:scale-100 motion-reduce:active:scale-100'

function segmentClasses(p: MockGoalRow['prioridad'], active: boolean) {
  if (!active) {
    return cn(
      segmentBase,
      'bloomora-goal-priority-segment--idle text-bloomora-text-muted hover:bg-bloomora-white/70',
    )
  }
  if (p === 'Alta') {
    return cn(
      segmentBase,
      'bloomora-goal-priority-segment--active bloomora-goal-priority-segment--alta',
      'bg-rose-100 text-rose-800 ring-1 ring-rose-200/90',
    )
  }
  if (p === 'Baja') {
    return cn(
      segmentBase,
      'bloomora-goal-priority-segment--active bloomora-goal-priority-segment--baja',
      'bg-sky-100 text-sky-800 ring-1 ring-sky-200/90',
    )
  }
  return cn(
    segmentBase,
    'bloomora-goal-priority-segment--active bloomora-goal-priority-segment--media',
    'bg-violet-100 text-violet-800 ring-1 ring-violet-200/90',
  )
}

export type GoalPriorityPickerProps = {
  value: MockGoalRow['prioridad']
  onChange: (p: MockGoalRow['prioridad']) => void
  disabled?: boolean
  className?: string
}

export function GoalPriorityPicker({
  value,
  onChange,
  disabled,
  className,
}: GoalPriorityPickerProps) {
  return (
    <div
      role="group"
      aria-label="Prioridad de la meta"
      className={cn(
        'bloomora-goal-priority inline-flex flex-wrap gap-0.5 rounded-full bg-bloomora-mist/75 p-0.5 ring-1 ring-bloomora-line/35',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
        className,
      )}
    >
      {PRIORITIES.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          aria-pressed={value === p}
          onClick={() => {
            if (p !== value) onChange(p)
          }}
          className={cn(
            segmentClasses(p, value === p),
            disabled && 'pointer-events-none opacity-45',
          )}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
