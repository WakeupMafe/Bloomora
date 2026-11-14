import { useId, useRef, useState, type ReactNode } from 'react'
import { NoteBottomSheet } from '@/features/notes/NoteBottomSheet'
import type { NoteTextOptionsValues } from '@/features/notes/NoteTextOptionsPanel'
import {
  NOTE_FONT_SIZE_SLIDER_MAX,
  NOTE_FONT_SIZE_SLIDER_MIN,
  NOTE_HIGHLIGHT_PRESETS,
  NOTE_TEXT_OPTION_FONTS,
} from '@/features/notes/noteTextOptionsConstants'
import type {
  NoteBodyFont,
  NoteFontWeight,
  NoteParagraphStyle,
  NoteTextAlign,
  NoteTextCase,
} from '@/features/notes/noteTypingDefaults'
import { noteBodyFontFamily } from '@/features/notes/noteFontUtils'
import { ENGLISH_NOTE_COLORS, type EnglishNoteColor } from '@/types/englishNote'
import { NOTE_LINE_HEIGHTS } from '@/features/notes/noteSpacingModel.mjs'
import { cn } from '@/utils/cn'

type FormatTab = 'texto' | 'parrafo'

type NoteFormatSheetProps = {
  open: boolean
  onClose: () => void
  values: NoteTextOptionsValues
  paragraphStyle: NoteParagraphStyle
  active: {
    underline: boolean
    strike: boolean
    align: NoteTextAlign
  }
  onParagraphStyleChange: (style: NoteParagraphStyle) => void
  onFontChange: (font: NoteBodyFont) => void
  onFontSizeChange: (px: number) => void
  onFontWeight: (weight: NoteFontWeight) => void
  onUnderline: () => void
  onStrike: () => void
  onTextCase: (textCase: NoteTextCase) => void
  onTextColor: (hex: string, colorId: EnglishNoteColor) => void
  onCustomTextColor: (hex: string) => void
  onHighlight: (hex: string) => void
  onClearHighlight: () => void
  onAlign: (align: NoteTextAlign) => void
  onLineHeight: (value: number) => void
  onParagraphSpacingChange: (value: number) => void
  onBulletList: () => void
  onNumberedList: () => void
  onInsertNote: () => void
  onClearFormat?: () => void
}

const STYLE_CHIPS: Array<{ id: NoteParagraphStyle; label: string; className?: string }> = [
  { id: 'p', label: 'Normal' },
  { id: 'h1', label: 'T1', className: 'text-[17px]' },
  { id: 'h2', label: 'T2', className: 'text-[16px]' },
  { id: 'h3', label: 'T3' },
]

function Chip({
  active,
  onClick,
  children,
  className,
  label,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn('note-format-sheet__chip', active && 'note-format-sheet__chip--on', className)}
    >
      {children}
    </button>
  )
}

function Swatch({
  active,
  color,
  onClick,
  label,
  highlight = false,
}: {
  active?: boolean
  color: string
  onClick: () => void
  label: string
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'note-format-sheet__swatch',
        highlight && 'note-format-sheet__swatch--hl',
        active && 'note-format-sheet__swatch--on',
      )}
    >
      <i style={{ background: color }} />
    </button>
  )
}

/**
 * Narrow bottom sheet for Aa Formato (Texto | Párrafo).
 * Applies instantly through the same editor handlers as the desktop panel.
 */
export function NoteFormatSheet({
  open,
  onClose,
  values,
  paragraphStyle,
  active,
  onParagraphStyleChange,
  onFontChange,
  onFontSizeChange,
  onFontWeight,
  onUnderline,
  onStrike,
  onTextCase,
  onTextColor,
  onCustomTextColor,
  onHighlight,
  onClearHighlight,
  onAlign,
  onLineHeight,
  onParagraphSpacingChange,
  onBulletList,
  onNumberedList,
  onInsertNote,
  onClearFormat,
}: NoteFormatSheetProps) {
  const [tab, setTab] = useState<FormatTab>('texto')
  const customColorRef = useRef<HTMLInputElement>(null)
  const customHighlightRef = useRef<HTMLInputElement>(null)
  const fontSelectId = useId()

  const clampSize = (px: number) =>
    Math.min(NOTE_FONT_SIZE_SLIDER_MAX, Math.max(NOTE_FONT_SIZE_SLIDER_MIN, Math.round(px)))

  const colorLabel =
    ENGLISH_NOTE_COLORS.find((c) => c.id === values.colorId)?.label ?? 'Personalizado'

  return (
    <NoteBottomSheet
      open={open}
      onClose={onClose}
      title={(
        <>
          <span className="note-format-sheet__aa" aria-hidden>Aa</span>
          Formato
        </>
      )}
    >
      <div className="note-format-sheet__seg" role="tablist" aria-label="Sección de formato">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'texto'}
          className={cn(tab === 'texto' && 'is-on')}
          onClick={() => setTab('texto')}
        >
          Texto
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'parrafo'}
          className={cn(tab === 'parrafo' && 'is-on')}
          onClick={() => setTab('parrafo')}
        >
          Párrafo
        </button>
      </div>

      {tab === 'texto' ? (
        <div className="note-format-sheet__panel" role="tabpanel">
          <p className="note-format-sheet__fl">Estilo</p>
          <div className="note-format-sheet__row">
            {STYLE_CHIPS.map((chip) => (
              <Chip
                key={chip.id}
                className={cn('note-format-sheet__chip--flex', chip.className)}
                active={paragraphStyle === chip.id}
                onClick={() => onParagraphStyleChange(chip.id)}
              >
                {chip.label}
              </Chip>
            ))}
          </div>

          <div className="note-format-sheet__fl note-format-sheet__fl--split">
            <span>Fuente</span>
            <span>Tamaño</span>
          </div>
          <div className="note-format-sheet__row">
            <label className="note-format-sheet__select" htmlFor={fontSelectId}>
              <span style={{ fontFamily: noteBodyFontFamily(values.font) }}>
                {NOTE_TEXT_OPTION_FONTS.find((f) => f.id === values.font)?.label ?? 'Fuente'}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <select
                id={fontSelectId}
                aria-label="Fuente"
                value={values.font}
                onChange={(event) => onFontChange(event.target.value as NoteBodyFont)}
              >
                {NOTE_TEXT_OPTION_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </label>
            <div className="note-format-sheet__step">
              <button
                type="button"
                aria-label="Más pequeño"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onFontSizeChange(clampSize(values.fontSizePx - 1))}
              >
                −
              </button>
              <b>{values.fontSizePx} px</b>
              <button
                type="button"
                aria-label="Más grande"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onFontSizeChange(clampSize(values.fontSizePx + 1))}
              >
                +
              </button>
            </div>
          </div>

          <p className="note-format-sheet__fl">Grosor</p>
          <div className="note-format-sheet__seg note-format-sheet__seg--weights">
            {(
              [
                ['normal', 'Normal', 500],
                ['medium', 'Medio', 600],
                ['bold', 'Negrita', 800],
              ] as const
            ).map(([id, label, weight]) => (
              <button
                key={id}
                type="button"
                className={cn(values.fontWeight === id && 'is-on')}
                style={{ fontWeight: weight }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onFontWeight(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="note-format-sheet__fl">Subrayado, tachado y mayúsculas</p>
          <div className="note-format-sheet__row">
            <Chip active={active.underline} onClick={onUnderline} label="Subrayado" className="note-format-sheet__chip--flex">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 4v6a6 6 0 0012 0V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Chip>
            <Chip active={active.strike} onClick={onStrike} label="Tachado" className="note-format-sheet__chip--flex">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 6.5C15 5 13.6 4.5 12 4.5c-2.5 0-4.3 1.3-4.3 3.3 0 1.4.9 2.4 2.6 3M15.5 14.5c.6.6.9 1.3.9 2.1 0 2-2 3.4-4.6 3.4-1.9 0-3.6-.7-4.6-2.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </Chip>
            <span className="note-format-sheet__vsep" aria-hidden />
            {(
              [
                ['capitalize', 'Abc', 'Capitalizar'],
                ['uppercase', 'ABC', 'Mayúsculas'],
                ['lowercase', 'abc', 'Minúsculas'],
              ] as const
            ).map(([id, preview, label]) => (
              <Chip
                key={id}
                active={values.textCase === id}
                onClick={() => onTextCase(id)}
                label={label}
                className="note-format-sheet__chip--flex"
              >
                {preview}
              </Chip>
            ))}
          </div>

          <div className="note-format-sheet__fl note-format-sheet__fl--split">
            <span>Color del texto</span>
            <em>{colorLabel}</em>
          </div>
          <div className="note-format-sheet__row note-format-sheet__row--between">
            {ENGLISH_NOTE_COLORS.map((color) => (
              <Swatch
                key={color.id}
                label={color.label}
                color={color.value}
                active={values.colorId === color.id}
                onClick={() => onTextColor(color.value, color.id)}
              />
            ))}
            <button
              type="button"
              className="note-format-sheet__swatch"
              aria-label="Color personalizado"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => customColorRef.current?.click()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
            <input
              ref={customColorRef}
              type="color"
              className="sr-only"
              onChange={(event) => onCustomTextColor(event.target.value)}
            />
          </div>

          <div className="note-format-sheet__fl note-format-sheet__fl--split">
            <span>Resaltado</span>
            <em>{values.highlightColor ? 'Activo' : 'Ninguno'}</em>
          </div>
          <div className="note-format-sheet__row note-format-sheet__row--between">
            <button
              type="button"
              aria-label="Sin resaltado"
              aria-pressed={!values.highlightColor}
              className={cn(
                'note-format-sheet__swatch note-format-sheet__swatch--hl',
                !values.highlightColor && 'note-format-sheet__swatch--on',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={onClearHighlight}
            >
              <i
                style={{
                  background: 'linear-gradient(135deg,#fff 45%,#C2416B 46%,#C2416B 54%,#fff 55%)',
                  border: '1px solid var(--color-bloomora-line)',
                }}
              />
            </button>
            {NOTE_HIGHLIGHT_PRESETS.map((preset) => (
              <Swatch
                key={preset.id}
                highlight
                label={preset.label}
                color={preset.color}
                active={values.highlightColor === preset.color}
                onClick={() => onHighlight(preset.color)}
              />
            ))}
            <button
              type="button"
              className="note-format-sheet__swatch"
              aria-label="Más colores de resaltado"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => customHighlightRef.current?.click()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
            <input
              ref={customHighlightRef}
              type="color"
              className="sr-only"
              onChange={(event) => onHighlight(event.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="note-format-sheet__panel" role="tabpanel">
          <p className="note-format-sheet__fl">Alineación</p>
          <div className="note-format-sheet__seg">
            {(
              [
                ['left', 'Izquierda', 'M4 6h16M4 10h10M4 14h16M4 18h10'],
                ['center', 'Centro', 'M4 6h16M7 10h10M4 14h16M7 18h10'],
                ['right', 'Derecha', 'M4 6h16M10 10h10M4 14h16M10 18h10'],
                ['justify', 'Justificado', 'M4 6h16M4 10h16M4 14h16M4 18h16'],
              ] as const
            ).map(([id, label, path]) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={active.align === id}
                className={cn(active.align === id && 'is-on')}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onAlign(id)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>

          <div className="note-format-sheet__fl note-format-sheet__fl--split">
            <span>Interlineado</span>
            <em>Espacio entre líneas</em>
          </div>
          <div className="note-format-sheet__row">
            {NOTE_LINE_HEIGHTS.map((spacing) => (
              <Chip
                key={spacing}
                className="note-format-sheet__chip--flex"
                active={Math.abs(values.lineHeight - spacing) < 0.01}
                onClick={() => onLineHeight(spacing)}
              >
                {spacing}
              </Chip>
            ))}
          </div>

          <p className="note-format-sheet__fl">Espacio después del párrafo</p>
          <div className="note-format-sheet__row">
            {[0, 6, 8, 12].map((px) => (
              <Chip
                key={px}
                className="note-format-sheet__chip--flex"
                active={values.paragraphSpacingPx === px}
                onClick={() => onParagraphSpacingChange(px)}
              >
                {px} px
              </Chip>
            ))}
          </div>

          <p className="note-format-sheet__fl">Listas y bloques</p>
          <div className="note-format-sheet__row">
            <Chip className="note-format-sheet__chip--flex" onClick={onBulletList}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
                <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
                <circle cx="4.5" cy="18" r="1.2" fill="currentColor" />
              </svg>
              Viñetas
            </Chip>
            <Chip className="note-format-sheet__chip--flex" onClick={onNumberedList}>
              <span className="text-[13px] font-bold">1.</span>
              Numerada
            </Chip>
            <Chip className="note-format-sheet__chip--flex" onClick={onInsertNote}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Nota
            </Chip>
          </div>

          {onClearFormat ? (
            <button
              type="button"
              className="note-format-sheet__clear"
              onMouseDown={(event) => event.preventDefault()}
              onClick={onClearFormat}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7L4 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Quitar formato del párrafo
            </button>
          ) : null}
        </div>
      )}
    </NoteBottomSheet>
  )
}
