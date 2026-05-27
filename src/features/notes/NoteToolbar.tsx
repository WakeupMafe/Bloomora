import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { bloomoraSelectClass } from '@/components/ui/formControls'
import { PencilIcon } from '@/features/flashcards/FlashcardIcons'
import { usePopoverDismiss } from '@/hooks/usePopoverDismiss'
import type { EnglishNotePageSize } from '@/types/englishNote'
import { ENGLISH_NOTE_PAGE_SIZES } from '@/types/englishNote'
import { cn } from '@/utils/cn'

type NoteToolbarProps = {
  onBold: () => void
  onUnderline: () => void
  onBulletList: () => void
  onNumberedList: () => void
  onAlignCenter: () => void
  onAlignLeft: () => void
  onInsertImage: () => void
  onUndo: () => void
  onRedo: () => void
  onExportPdf: () => void
  onPrint: () => void
  pageSize: EnglishNotePageSize
  onPageSizeChange: (v: EnglishNotePageSize) => void
  pageNumberEnabled: boolean
  onPageNumberEnabledChange: (enabled: boolean) => void
  twoColumns: boolean
  onTwoColumnsChange: (enabled: boolean) => void
  onSave: () => void
}

function UndoIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 7H5v4M5 11c1.5-3 4.2-5 8-5 4.5 0 8 3.6 8 8s-3.5 8-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 7h4v4M19 11c-1.5-3-4.2-5-8-5-4.5 0-8 3.6-8 8s3.5 8 8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const iconBtnClass = '!min-h-9 !min-w-9 !px-0'

const NOTE_SHORTCUTS = [
  { keys: 'Ctrl+G', desc: 'Guardar en Supabase' },
  { keys: 'Ctrl+O', desc: 'Formato del texto (selección o al escribir)' },
  { keys: 'Ctrl + + / −', desc: 'Tamaño de letra ±10 px (con selección)' },
] as const

function InfoIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 11v5M12 8.25h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NoteToolbarHelp() {
  const uid = useId().replace(/:/g, '')
  const triggerId = `note-help-trigger-${uid}`
  const panelId = `note-help-panel-${uid}`
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  usePopoverDismiss(open, triggerRef, panelRef, () => setOpen(false))

  return (
    <div className="relative shrink-0">
      <Button
        ref={triggerRef}
        id={triggerId}
        type="button"
        variant={open ? 'primary' : 'secondary'}
        size="sm"
        className={iconBtnClass}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Cerrar ayuda de atajos' : 'Ver ayuda de atajos'}
        title="Ayuda y atajos"
      >
        <InfoIcon />
      </Button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={triggerId}
          className="absolute right-0 top-[calc(100%+0.35rem)] z-30 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-bloomora-line/30 bg-bloomora-white p-3 shadow-[0_16px_40px_-16px_rgba(91,74,140,0.45)]"
        >
          <p className="mb-2 text-xs font-bold text-bloomora-deep">Atajos del editor</p>
          <ul className="space-y-2 text-[0.7rem] leading-snug text-bloomora-text-muted">
            {NOTE_SHORTCUTS.map((item) => (
              <li key={item.keys} className="flex gap-2">
                <kbd className="shrink-0 rounded-md bg-bloomora-snow px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-bloomora-deep ring-1 ring-bloomora-line/25">
                  {item.keys}
                </kbd>
                <span>{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function NoteToolbar(props: NoteToolbarProps) {
  const [open, setOpen] = useState(true)
  const panelId = 'english-note-toolbar-panel'

  return (
    <div className="rounded-2xl border border-bloomora-line/25 bg-bloomora-white/85 p-2">
      <div className="flex items-start gap-2">
        <Button
          type="button"
          variant={open ? 'primary' : 'secondary'}
          size="sm"
          className={cn(iconBtnClass, 'shrink-0')}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? 'Ocultar herramientas de edición' : 'Mostrar herramientas de edición'}
          title={open ? 'Ocultar herramientas' : 'Mostrar herramientas'}
        >
          <PencilIcon className="size-[1.125rem]" />
        </Button>

        {open ? (
          <div
            id={panelId}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
          >
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={iconBtnClass}
              onClick={props.onUndo}
              aria-label="Deshacer"
              title="Deshacer"
            >
              <UndoIcon />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={iconBtnClass}
              onClick={props.onRedo}
              aria-label="Rehacer"
              title="Rehacer"
            >
              <RedoIcon />
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={props.onBold}>
              B
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={props.onUnderline}>
              U
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={props.onBulletList}>
              Lista
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={props.onNumberedList}>
              Numerada
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={props.onAlignCenter}
              title="Centrar párrafo"
            >
              Centrar
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={props.onInsertImage}>
              Imagen
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={props.onExportPdf}>
              PDF
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={props.onPrint}>
              Imprimir
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={props.onSave}
              title="Guardar en Supabase (Ctrl+G)"
            >
              Guardar
            </Button>
            <div className="flex items-center gap-1.5">
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-bloomora-text-muted">
                Hoja
              </span>
              <select
                value={props.pageSize}
                onChange={(e) => props.onPageSizeChange(e.target.value as EnglishNotePageSize)}
                className={cn(bloomoraSelectClass, '!min-h-9 w-auto px-3 py-1.5 text-xs')}
                aria-label="Tamaño de hoja"
              >
                {ENGLISH_NOTE_PAGE_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortLabel}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant={props.pageNumberEnabled ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => props.onPageNumberEnabledChange(!props.pageNumberEnabled)}
              aria-pressed={props.pageNumberEnabled}
            >
              N° hoja
            </Button>
            <Button
              type="button"
              variant={props.twoColumns ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => props.onTwoColumnsChange(!props.twoColumns)}
              aria-pressed={props.twoColumns}
              title="Dividir el contenido en dos columnas"
            >
              2 columnas
            </Button>
            <NoteToolbarHelp />
          </div>
        ) : null}
      </div>
    </div>
  )
}
