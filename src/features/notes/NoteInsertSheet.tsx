import type { ReactNode } from 'react'
import { NoteBottomSheet } from '@/features/notes/NoteBottomSheet'
import { ENGLISH_NOTE_PAGE_SIZES, type EnglishNotePageSize } from '@/types/englishNote'
import { cn } from '@/utils/cn'

type NoteInsertSheetProps = {
  open: boolean
  onClose: () => void
  onInsertPageBreak: () => void
  onInsertImage: () => void
  onInsertNote: () => void
  onBulletList: () => void
  onNumberedList: () => void
  pageSize: EnglishNotePageSize
  onPageSizeChange: (size: EnglishNotePageSize) => void
  pageNumberEnabled: boolean
  onPageNumberEnabledChange: (enabled: boolean) => void
  twoColumns: boolean
  onTwoColumnsChange: (enabled: boolean) => void
  onExportPdf: () => void
  onPrint: () => void
}

function Tile({
  title,
  subtitle,
  onClick,
  hero = false,
  icon,
}: {
  title: string
  subtitle?: string
  onClick: () => void
  hero?: boolean
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      className={cn('note-insert-sheet__tile', hero && 'note-insert-sheet__tile--hero')}
      onClick={onClick}
    >
      <span className="note-insert-sheet__tile-icon" aria-hidden>{icon}</span>
      <span className="note-insert-sheet__tile-copy">
        <b>{title}</b>
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
    </button>
  )
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={cn('note-insert-sheet__toggle', on && 'is-on')}
      onClick={() => onChange(!on)}
    />
  )
}

/** Narrow bottom sheet for Insertar (page break hero + media/lists + hoja/export). */
export function NoteInsertSheet({
  open,
  onClose,
  onInsertPageBreak,
  onInsertImage,
  onInsertNote,
  onBulletList,
  onNumberedList,
  pageSize,
  onPageSizeChange,
  pageNumberEnabled,
  onPageNumberEnabledChange,
  twoColumns,
  onTwoColumnsChange,
  onExportPdf,
  onPrint,
}: NoteInsertSheetProps) {
  const run = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <NoteBottomSheet
      open={open}
      onClose={onClose}
      title={(
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Insertar
        </>
      )}
    >
      <Tile
        hero
        title="Salto de página"
        subtitle="Corta la hoja donde está el cursor. Lo que sigue pasa a una hoja nueva."
        onClick={() => run(onInsertPageBreak)}
        icon={(
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 3v5h12V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 21v-5h12v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.5 12h2.5M8 12h3M13.5 12h3M19 12h2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      />

      <div className="note-insert-sheet__grid">
        <Tile
          title="Imagen"
          subtitle="De tu galería"
          onClick={() => run(onInsertImage)}
          icon={(
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="10" r="2" fill="currentColor" />
              <path d="M21 16l-5-5-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        />
        <Tile
          title="Nota"
          subtitle="Recuadro destacado"
          onClick={() => run(onInsertNote)}
          icon={(
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 8v8" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          )}
        />
        <Tile
          title="Lista numerada"
          onClick={() => run(onNumberedList)}
          icon={(
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M10 6h10M10 12h10M10 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 4.5h1.5V9M4 9h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M4 14.5c.5-.7 2.8-.9 2.8.6 0 1.2-2.8 2-2.8 3.4h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        />
        <Tile
          title="Viñetas"
          onClick={() => run(onBulletList)}
          icon={(
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
              <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
              <circle cx="4.5" cy="18" r="1.2" fill="currentColor" />
            </svg>
          )}
        />
      </div>

      <p className="note-insert-sheet__fl">Hoja</p>
      <div className="note-insert-sheet__row">
        <div className="note-insert-sheet__lt">Tamaño de hoja</div>
        <div className="note-format-sheet__seg note-insert-sheet__page-seg" role="group" aria-label="Tamaño de hoja">
          {ENGLISH_NOTE_PAGE_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              className={cn(pageSize === size.id && 'is-on')}
              onClick={() => onPageSizeChange(size.id)}
            >
              {size.shortLabel}
            </button>
          ))}
        </div>
      </div>
      <div className="note-insert-sheet__row">
        <div className="note-insert-sheet__lt">
          Número de hoja
          <small>Abajo, en cada hoja</small>
        </div>
        <Toggle
          on={pageNumberEnabled}
          onChange={onPageNumberEnabledChange}
          label="Número de hoja"
        />
      </div>
      <div className="note-insert-sheet__row">
        <div className="note-insert-sheet__lt">
          Dos columnas
          <small>Solo se ven en tablet y PC</small>
        </div>
        <Toggle
          on={twoColumns}
          onChange={onTwoColumnsChange}
          label="Dos columnas"
        />
      </div>

      <p className="note-insert-sheet__fl">Exportar</p>
      <div className="note-insert-sheet__export">
        <button type="button" className="note-insert-sheet__export-btn" onClick={() => run(onExportPdf)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 15h6M12 12v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Descargar PDF
        </button>
        <button type="button" className="note-insert-sheet__export-btn" onClick={() => run(onPrint)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M7 9V3h10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="9" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M7 14h10v7H7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          Imprimir
        </button>
      </div>
    </NoteBottomSheet>
  )
}
