import { useId, useRef, useState } from 'react'
import type { NoteFormatTarget } from '@/features/notes/noteTextOptionsConstants'
import {
  NOTE_FONT_SIZE_SLIDER_MAX,
  NOTE_FONT_SIZE_SLIDER_MIN,
  NOTE_HIGHLIGHT_PRESETS,
  NOTE_TEXT_OPTION_FONTS,
} from '@/features/notes/noteTextOptionsConstants'
import type {
  NoteFontWeight,
  NoteTextAlign,
  NoteTextCase,
} from '@/features/notes/noteTypingDefaults'
import type { EnglishNoteColor, EnglishNoteTitleFont } from '@/types/englishNote'
import { ENGLISH_NOTE_COLORS } from '@/types/englishNote'
import { cn } from '@/utils/cn'

export type NoteTextOptionsValues = {
  font: EnglishNoteTitleFont
  fontSizePx: number
  colorId: EnglishNoteColor
  align: NoteTextAlign
  fontWeight: NoteFontWeight
  lineHeight: number
  textCase: NoteTextCase
  highlightColor: string | null
}

type NoteTextOptionsPanelProps = {
  formatTarget: NoteFormatTarget
  values: NoteTextOptionsValues
  onClose: () => void
  keepSelection: (e: React.MouseEvent) => void
  onFontChange: (font: EnglishNoteTitleFont) => void
  onFontSizeChange: (px: number) => void
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onCustomTextColor: (hex: string) => void
  onHighlight: (hex: string) => void
  onClearHighlight: () => void
  onFontWeight: (weight: NoteFontWeight) => void
  onAlign: (align: NoteTextAlign) => void
  onLineHeight: (value: number) => void
  onTextCase: (textCase: NoteTextCase) => void
  onApplyTextoPreset?: () => void
}

function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.06em] text-bloomora-violet">
        {children}
      </span>
      {action}
    </div>
  )
}

function AlignIcon({ kind }: { kind: NoteTextAlign }) {
  const bars =
    kind === 'left'
      ? ['w-full', 'w-4/5', 'w-3/5']
      : kind === 'center'
        ? ['w-full mx-auto', 'w-4/5 mx-auto', 'w-3/5 mx-auto']
        : kind === 'right'
          ? ['w-full ml-auto', 'w-4/5 ml-auto', 'w-3/5 ml-auto']
          : ['w-full', 'w-full', 'w-full']
  return (
    <span className="flex w-5 flex-col gap-[3px]" aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className={cn('block h-[2px] rounded-full bg-current', w)} />
      ))}
    </span>
  )
}

function WeightPreview({ weight }: { weight: NoteFontWeight }) {
  return (
    <span
      className={cn(
        'text-lg leading-none text-bloomora-deep',
        weight === 'bold' && 'font-bold',
        weight === 'medium' && 'font-semibold',
        weight === 'normal' && 'font-normal',
      )}
    >
      Aa
    </span>
  )
}

export function NoteTextOptionsPanel({
  formatTarget,
  values,
  onClose,
  keepSelection,
  onFontChange,
  onFontSizeChange,
  onTextColor,
  onCustomTextColor,
  onHighlight,
  onClearHighlight,
  onFontWeight,
  onAlign,
  onLineHeight,
  onTextCase,
  onApplyTextoPreset,
}: NoteTextOptionsPanelProps) {
  const titleId = useId()
  const customColorRef = useRef<HTMLInputElement>(null)
  const customHighlightRef = useRef<HTMLInputElement>(null)
  const [sliderActive, setSliderActive] = useState(false)
  const [fontsExpanded, setFontsExpanded] = useState(false)

  const visibleFonts = fontsExpanded
    ? NOTE_TEXT_OPTION_FONTS
    : NOTE_TEXT_OPTION_FONTS.slice(0, 3)
  const isTyping = formatTarget === 'typing'

  const clampSize = (px: number) =>
    Math.min(
      NOTE_FONT_SIZE_SLIDER_MAX,
      Math.max(NOTE_FONT_SIZE_SLIDER_MIN, Math.round(px)),
    )

  const stepSize = (delta: number) => {
    onFontSizeChange(clampSize(values.fontSizePx + delta))
  }

  const stepLineHeight = (delta: number) => {
    const next = Math.min(3, Math.max(1, Math.round((values.lineHeight + delta) * 10) / 10))
    onLineHeight(next)
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
      data-note-selection-toolbar
      onMouseDown={keepSelection}
      className="note-text-options-panel flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_20px_56px_-12px_rgba(91,74,140,0.28)] ring-1 ring-bloomora-line/35 sm:max-h-[min(calc(100dvh-3rem),40rem)]"
    >
      <header className="relative flex shrink-0 items-start gap-3 border-b border-bloomora-line/20 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-bloomora-violet to-[#8b7ed6] text-sm font-bold text-white shadow-[0_6px_16px_-4px_rgba(124,107,181,0.55)]"
          aria-hidden
        >
          Tt
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <h2
            id={titleId}
            className="text-base font-bold tracking-tight text-bloomora-deep sm:text-[1.05rem]"
          >
            Opciones de texto
          </h2>
          <p className="mt-0.5 text-xs text-bloomora-text-muted">
            {isTyping
              ? 'Personaliza el estilo del texto que vas a escribir'
              : 'Personaliza el estilo de tu texto seleccionado'}
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-bloomora-lavender-50 text-bloomora-text-muted transition hover:bg-bloomora-lilac/25 hover:text-bloomora-deep sm:right-4 sm:top-4"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3 3l8 8M11 3L3 11"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        {isTyping && onApplyTextoPreset ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-bloomora-lavender-50/80 px-3 py-2.5 ring-1 ring-bloomora-line/25">
            <button
              type="button"
              onClick={onApplyTextoPreset}
              className="rounded-full bg-gradient-to-r from-bloomora-violet to-[#9b86f0] px-4 py-1.5 text-xs font-bold text-white shadow-[0_8px_20px_-6px_rgba(124,107,181,0.5)] transition hover:brightness-105"
            >
              Texto
            </button>
            <span className="text-[0.7rem] text-bloomora-text-muted">
              Poppins, gris, izquierda, 15px
            </span>
          </div>
        ) : null}

        <section className="mb-5">
          <SectionLabel
            action={
              !fontsExpanded && NOTE_TEXT_OPTION_FONTS.length > 3 ? (
                <button
                  type="button"
                  className="text-[0.7rem] font-semibold text-bloomora-violet hover:underline"
                  onClick={() => setFontsExpanded(true)}
                >
                  Ver más
                </button>
              ) : null
            }
          >
            Fuente
          </SectionLabel>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleFonts.map((f) => {
              const selected = values.font === f.id
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFontChange(f.id)}
                  className={cn(
                    'relative min-w-[4.75rem] shrink-0 rounded-xl border px-3 py-2.5 text-left transition',
                    selected
                      ? 'border-bloomora-violet bg-bloomora-lavender-50/90 ring-2 ring-bloomora-violet/35'
                      : 'border-bloomora-line/40 bg-white hover:border-bloomora-lilac/50',
                  )}
                >
                  {selected ? (
                    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-bloomora-violet text-[0.55rem] text-white">
                      ✓
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      'block text-sm font-semibold text-bloomora-deep',
                      f.id === 'popis' && 'font-[Poppins,sans-serif]',
                      f.id === 'arial' && 'font-[Arial,sans-serif]',
                      (f.id === 'cursive' || f.id === 'cursive2') && 'italic',
                    )}
                  >
                    {f.label}
                  </span>
                </button>
              )
            })}
            {!fontsExpanded ? (
              <button
                type="button"
                aria-label="Más fuentes"
                onClick={() => setFontsExpanded(true)}
                className="flex min-w-[2.5rem] shrink-0 items-center justify-center rounded-xl border border-bloomora-line/40 text-bloomora-text-muted hover:border-bloomora-lilac/50"
              >
                …
              </button>
            ) : null}
          </div>
        </section>

        <section className="mb-5">
          <SectionLabel>Tamaño</SectionLabel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex shrink-0 items-center rounded-xl border border-bloomora-line/35 bg-bloomora-snow/80">
              <button
                type="button"
                aria-label="Reducir tamaño"
                onClick={() => stepSize(-1)}
                className="flex size-9 items-center justify-center text-lg text-bloomora-violet hover:bg-bloomora-lavender-50/80"
              >
                −
              </button>
              <span className="min-w-[3.25rem] text-center text-sm font-semibold tabular-nums text-bloomora-deep">
                {values.fontSizePx} px
              </span>
              <button
                type="button"
                aria-label="Aumentar tamaño"
                onClick={() => stepSize(1)}
                className="flex size-9 items-center justify-center text-lg text-bloomora-violet hover:bg-bloomora-lavender-50/80"
              >
                +
              </button>
            </div>
            <div className="relative min-w-0 flex-1 pt-1">
              {sliderActive ? (
                <span
                  className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg bg-bloomora-violet px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-md"
                  style={{
                    left: `${((values.fontSizePx - NOTE_FONT_SIZE_SLIDER_MIN) / (NOTE_FONT_SIZE_SLIDER_MAX - NOTE_FONT_SIZE_SLIDER_MIN)) * 100}%`,
                  }}
                >
                  {values.fontSizePx}px
                </span>
              ) : null}
              <input
                type="range"
                min={NOTE_FONT_SIZE_SLIDER_MIN}
                max={NOTE_FONT_SIZE_SLIDER_MAX}
                value={clampSize(values.fontSizePx)}
                onPointerDown={() => setSliderActive(true)}
                onPointerUp={() => setSliderActive(false)}
                onPointerLeave={() => setSliderActive(false)}
                onChange={(e) => onFontSizeChange(clampSize(Number(e.target.value)))}
                className="note-text-options-slider w-full"
                style={{
                  ['--note-slider-pct' as string]: `${((clampSize(values.fontSizePx) - NOTE_FONT_SIZE_SLIDER_MIN) / (NOTE_FONT_SIZE_SLIDER_MAX - NOTE_FONT_SIZE_SLIDER_MIN)) * 100}%`,
                }}
              />
              <div className="mt-1 flex justify-between text-[0.65rem] text-bloomora-text-muted">
                <span>{NOTE_FONT_SIZE_SLIDER_MIN}px</span>
                <span>{NOTE_FONT_SIZE_SLIDER_MAX}px</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <SectionLabel>Peso</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['normal', 'Normal'],
                ['medium', 'Medio'],
                ['bold', 'Negrita'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onFontWeight(id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition',
                  values.fontWeight === id
                    ? 'border-bloomora-violet bg-bloomora-lavender-50/90 ring-2 ring-bloomora-violet/30'
                    : 'border-bloomora-line/35 hover:border-bloomora-lilac/45',
                )}
              >
                <WeightPreview weight={id} />
                <span className="text-[0.7rem] font-semibold text-bloomora-deep">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <SectionLabel>Color del texto</SectionLabel>
          <div className="flex flex-wrap items-center gap-2">
            {ENGLISH_NOTE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                aria-label={c.label}
                aria-pressed={values.colorId === c.id}
                onClick={() => onTextColor(c.value, c.id)}
                className={cn(
                  'size-8 rounded-full border-2 transition hover:scale-105',
                  values.colorId === c.id
                    ? 'border-bloomora-violet ring-2 ring-bloomora-violet/35'
                    : 'border-white shadow-sm',
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <button
              type="button"
              title="Cuentagotas"
              aria-label="Cuentagotas"
              className="flex size-8 items-center justify-center rounded-full border border-bloomora-line/40 bg-bloomora-snow text-bloomora-violet hover:bg-bloomora-lavender-50/80"
              onClick={async () => {
                if (!('EyeDropper' in window)) return
                try {
                  const dropper = new (
                    window as Window & {
                      EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> }
                    }
                  ).EyeDropper()
                  const { sRGBHex } = await dropper.open()
                  onCustomTextColor(sRGBHex)
                } catch {
                  /* cancelado */
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 20l8-8m4-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => customColorRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-bloomora-line/35 px-2.5 py-1.5 text-[0.7rem] font-semibold text-bloomora-deep hover:bg-bloomora-lavender-50/60"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-bloomora-lavender-50 text-bloomora-violet">
                +
              </span>
              Color personalizado
            </button>
            <input
              ref={customColorRef}
              type="color"
              className="sr-only"
              onChange={(e) => onCustomTextColor(e.target.value)}
            />
          </div>
        </section>

        {!isTyping ? (
          <section className="mb-5">
            <SectionLabel>Resaltado</SectionLabel>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClearHighlight}
                aria-pressed={!values.highlightColor}
                className={cn(
                  'flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg border px-2 text-sm font-semibold text-bloomora-deep transition',
                  !values.highlightColor
                    ? 'border-bloomora-violet bg-bloomora-lavender-50/90 ring-2 ring-bloomora-violet/30'
                    : 'border-bloomora-line/35 hover:border-bloomora-lilac/45',
                )}
              >
                <span className="relative">
                  A
                  <span className="absolute inset-x-0 top-1/2 h-[2px] -rotate-12 bg-bloomora-deep/70" />
                </span>
              </button>
              {NOTE_HIGHLIGHT_PRESETS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  title={h.label}
                  aria-label={h.label}
                  aria-pressed={values.highlightColor === h.color}
                  onClick={() => onHighlight(h.color)}
                  className={cn(
                    'flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border text-xs font-bold transition hover:scale-105',
                    values.highlightColor === h.color
                      ? 'border-bloomora-violet ring-2 ring-bloomora-violet/30'
                      : 'border-bloomora-line/30',
                  )}
                  style={{ backgroundColor: h.color }}
                >
                  Aa
                </button>
              ))}
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg border border-dashed border-bloomora-line/45 px-2 py-1.5 text-[0.65rem] font-semibold text-bloomora-text-muted hover:border-bloomora-violet/40"
                onClick={() => customHighlightRef.current?.click()}
              >
                + Más colores
              </button>
              <input
                ref={customHighlightRef}
                type="color"
                className="sr-only"
                onChange={(e) => onHighlight(e.target.value)}
              />
            </div>
            <p className="mt-2 flex items-start gap-2 rounded-xl bg-bloomora-lavender-50/70 px-3 py-2 text-[0.7rem] leading-snug text-bloomora-violet">
              <span className="mt-0.5 shrink-0 font-bold" aria-hidden>
                i
              </span>
              Elige &apos;Sin resaltado&apos; para quitar el resaltado del texto.
            </p>
          </section>
        ) : null}

        <section className="mb-5">
          <SectionLabel>Alineación</SectionLabel>
          <div className="inline-flex rounded-xl border border-bloomora-line/30 bg-bloomora-snow/50 p-1">
            {(
              [
                ['left', 'Izquierda'],
                ['center', 'Centro'],
                ['right', 'Derecha'],
                ['justify', 'Justificado'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={values.align === id}
                onClick={() => onAlign(id)}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition',
                  values.align === id
                    ? 'bg-bloomora-lavender-50 text-bloomora-violet shadow-sm ring-1 ring-bloomora-violet/25'
                    : 'text-bloomora-text-muted hover:bg-white/80 hover:text-bloomora-deep',
                )}
              >
                <AlignIcon kind={id} />
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section>
            <SectionLabel>Espaciado entre líneas</SectionLabel>
            <div className="flex items-center rounded-xl border border-bloomora-line/35 bg-bloomora-snow/80">
              <button
                type="button"
                aria-label="Reducir interlineado"
                onClick={() => stepLineHeight(-0.1)}
                className="flex size-9 items-center justify-center text-lg text-bloomora-violet hover:bg-bloomora-lavender-50/80"
              >
                −
              </button>
              <span className="min-w-[2.5rem] flex-1 text-center text-sm font-semibold tabular-nums text-bloomora-deep">
                {values.lineHeight}
              </span>
              <button
                type="button"
                aria-label="Aumentar interlineado"
                onClick={() => stepLineHeight(0.1)}
                className="flex size-9 items-center justify-center text-lg text-bloomora-violet hover:bg-bloomora-lavender-50/80"
              >
                +
              </button>
            </div>
          </section>

          <section>
            <SectionLabel>Mayúsculas / minúsculas</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  ['uppercase', 'AA', 'Mayúsculas'],
                  ['lowercase', 'aa', 'Minúsculas'],
                  ['capitalize', 'Aa', 'Capitalizar'],
                ] as const
              ).map(([id, preview, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTextCase(id)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[0.7rem] transition',
                    values.textCase === id
                      ? 'border-bloomora-violet bg-bloomora-lavender-50/90 ring-1 ring-bloomora-violet/30'
                      : 'border-bloomora-line/30 hover:border-bloomora-lilac/40',
                  )}
                >
                  <span className="w-6 shrink-0 text-center font-bold text-bloomora-violet">
                    {preview}
                  </span>
                  <span className="font-semibold text-bloomora-deep">{label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
