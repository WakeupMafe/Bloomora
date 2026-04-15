import { useCallback, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MockGoalRow } from '@/data/dashboardMock'
import { useFixedPopoverPosition } from '@/hooks/useFixedPopoverPosition'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
import { cn } from '@/utils/cn'
import {
  getTrackerSwatch,
  TRACKER_PASTELS,
  TRACKER_VIBRANTS,
} from '@/features/goals/trackerColorPalette'

const PANEL_WIDTH = 268
const PANEL_HEIGHT_EST = 340
const Z_BACKDROP = 10_040
const Z_PANEL = 10_050

type TrackerColorMenuProps = {
  value: string | undefined
  accent: MockGoalRow['accent']
  onChange: (trackerColorId: string) => void
  compact?: boolean
}

function SwatchButton({
  active,
  from,
  to,
  onPick,
}: {
  active: boolean
  from: string
  to: string
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        'h-8 w-8 shrink-0 rounded-full transition-transform hover:scale-110 active:scale-95',
        'ring-2 ring-offset-2 ring-offset-[#fffafc]',
        active
          ? 'ring-bloomora-deep scale-105'
          : 'ring-transparent hover:ring-bloomora-line/80',
      )}
      style={{
        background: `linear-gradient(145deg, ${from}, ${to})`,
        boxShadow: '0 2px 10px rgba(91, 74, 140, 0.12)',
      }}
      aria-label="Elegir color"
    />
  )
}

function ColorPickerPanelContent({
  currentId,
  onPick,
}: {
  currentId: string
  onPick: (id: string) => void
}) {
  return (
    <>
      <p className="mb-2 text-[11px] font-semibold leading-snug text-bloomora-text-muted">
        Los días marcados usan el color que elijas.
      </p>

      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-bloomora-violet">
        Pasteles
      </p>
      <div className="mb-3 grid grid-cols-6 gap-2">
        {TRACKER_PASTELS.map((s) => (
          <SwatchButton
            key={s.id}
            active={currentId === s.id}
            from={s.from}
            to={s.to}
            onPick={() => onPick(s.id)}
          />
        ))}
      </div>

      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-bloomora-violet">
        Vibrantes
      </p>
      <div className="grid grid-cols-6 gap-2">
        {TRACKER_VIBRANTS.map((s) => (
          <SwatchButton
            key={s.id}
            active={currentId === s.id}
            from={s.from}
            to={s.to}
            onPick={() => onPick(s.id)}
          />
        ))}
      </div>
    </>
  )
}

export function TrackerColorMenu({
  value,
  accent,
  onChange,
  compact = false,
}: TrackerColorMenuProps) {
  const uid = useId().replace(/:/g, '')
  const triggerDomId = `color-trigger-${uid}`
  const panelDomId = `color-panel-${uid}`

  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])
  const isNarrow = useMediaQuery('(max-width: 639px)')

  const coords = useFixedPopoverPosition(
    open && !isNarrow,
    triggerRef,
    PANEL_WIDTH,
    PANEL_HEIGHT_EST,
  )

  usePopoverDismiss(open, triggerRef, popoverRef, close)

  const current = getTrackerSwatch(value, accent)

  const overlay =
    open &&
    createPortal(
      <>
        {isNarrow ? (
          <button
            type="button"
            data-backdrop
            className="fixed inset-0 border-0 bg-bloomora-deep/20 p-0 backdrop-blur-[2px] transition-[background-color] duration-200 ease-out hover:bg-bloomora-deep/26 active:bg-bloomora-deep/30"
            style={{ zIndex: Z_BACKDROP }}
            aria-label="Cerrar selector de color"
            onClick={close}
          />
        ) : null}

        <div
          ref={popoverRef}
          id={panelDomId}
          role="dialog"
          aria-modal={isNarrow ? true : undefined}
          aria-label="Paleta de colores del calendario"
          className={cn(
            'flex flex-col overflow-hidden bg-[#fffafc]/[0.98] shadow-[0_16px_48px_rgba(91,74,140,0.18)] ring-1 ring-bloomora-line/35 backdrop-blur-md',
            isNarrow
              ? 'fixed rounded-[22px] p-3 sm:p-4'
              : 'fixed rounded-2xl p-3 sm:p-4',
          )}
          style={
            isNarrow
              ? {
                  position: 'fixed',
                  zIndex: Z_PANEL,
                  left: 'max(12px, env(safe-area-inset-left))',
                  right: 'max(12px, env(safe-area-inset-right))',
                  bottom: 'max(12px, env(safe-area-inset-bottom))',
                  maxHeight: 'min(52vh, 26rem)',
                }
              : coords
                ? {
                    position: 'fixed',
                    zIndex: Z_PANEL,
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                    maxHeight: 'min(72vh, 28rem)',
                  }
                : {
                    position: 'fixed',
                    zIndex: Z_PANEL,
                    top: 10,
                    left: 10,
                    width: PANEL_WIDTH,
                    maxHeight: 'min(72vh, 28rem)',
                    visibility: 'hidden' as const,
                  }
          }
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 py-0.5">
            <ColorPickerPanelContent
              currentId={current.id}
              onPick={(id) => {
                onChange(id)
                close()
              }}
            />
          </div>
        </div>
      </>,
      document.body,
    )

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerDomId}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelDomId : undefined}
        aria-label="Color de los días completados"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-2 rounded-full bg-white/85 font-semibold text-bloomora-deep shadow-[0_4px_14px_rgba(124,107,181,0.1)] ring-1 ring-bloomora-line/35 transition hover:bg-white hover:ring-bloomora-rose/25',
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs sm:text-sm',
        )}
      >
        <span
          className="h-4 w-4 shrink-0 rounded-full ring-1 ring-bloomora-line/25"
          style={{
            background: `linear-gradient(145deg, ${current.from}, ${current.to})`,
          }}
          aria-hidden
        />
        Color
        <span aria-hidden>🎨</span>
      </button>

      {overlay}
    </>
  )
}
