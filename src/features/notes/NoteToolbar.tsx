import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import textOptionsScreenshot from '@/assets/notes/ctrl-o-opciones-texto.png'
import { Button } from '@/components/ui/Button'
import { bloomoraSelectClass } from '@/components/ui/formControls'
import { FontSelect } from '@/features/notes/FontSelect'
import { HeadingSelect } from '@/features/notes/HeadingSelect'
import { SizeSelect } from '@/features/notes/SizeSelect'
import { NOTE_HIGHLIGHT_PRESETS } from '@/features/notes/noteTextOptionsConstants'
import { NOTE_LINE_HEIGHTS } from '@/features/notes/noteSpacingModel.mjs'
import { ENGLISH_NOTE_COLORS, ENGLISH_NOTE_PAGE_SIZES, type EnglishNotePageSize } from '@/types/englishNote'
import type { NoteBodyFont, NoteParagraphStyle, NoteTextAlign } from '@/features/notes/noteTypingDefaults'
import { cn } from '@/utils/cn'

type NoteToolbarProps = {
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
  onStrike: () => void
  onBulletList: () => void
  onNumberedList: () => void
  onAlign: (align: NoteTextAlign) => void
  onInsertImage: () => void
  onUndo: () => void
  onRedo: () => void
  onExportPdf: () => void
  onPrint: () => void
  onInsertPageBreak: () => void
  onInsertNote: () => void
  onFontChange: (font: NoteBodyFont) => void
  onFontSizeChange: (size: number) => void
  onFontSizeStep: (direction: -1 | 1) => void
  onParagraphStyleChange: (style: NoteParagraphStyle) => void
  onTextColor: (hex: string) => void
  onHighlight: (hex: string | null) => void
  onOpenTextOptions: () => void
  onLineHeightChange: (lineHeight: number) => void
  onSave: () => void
  active: {
    bold: boolean
    italic: boolean
    underline: boolean
    strike: boolean
    align: NoteTextAlign
  }
  font: NoteBodyFont
  fontSizePx: number
  paragraphStyle: NoteParagraphStyle
  textColor: string
  highlightColor: string | null
  lineHeight: number
  pageSize: EnglishNotePageSize
  onPageSizeChange: (v: EnglishNotePageSize) => void
  pageNumberEnabled: boolean
  onPageNumberEnabledChange: (enabled: boolean) => void
  twoColumns: boolean
  onTwoColumnsChange: (enabled: boolean) => void
  onBeforeControl: () => void
}

function ToolbarGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div role="group" aria-label={label} className="note-toolbar-group">
      <span className="note-toolbar-group__label">{label}</span>
      <div className="note-toolbar-group__controls">{children}</div>
    </div>
  )
}

function AlignGlyph({ align }: { align: NoteTextAlign }) {
  const widths = align === 'left' ? ['w-4', 'w-3', 'w-4']
    : align === 'center' ? ['w-4 mx-auto', 'w-3 mx-auto', 'w-4 mx-auto']
      : align === 'right' ? ['w-4 ml-auto', 'w-3 ml-auto', 'w-4 ml-auto']
        : ['w-4', 'w-4', 'w-4']
  return <span aria-hidden className="flex flex-col gap-[2px]">{widths.map((w, i) => <span key={i} className={cn('h-[2px] rounded-full bg-current', w)} />)}</span>
}

function ToolbarButton({
  label,
  shortcut,
  active = false,
  onClick,
  children,
  className,
}: {
  label: string
  shortcut?: string
  active?: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'note-toolbar-btn',
        active && 'note-toolbar-btn--active',
        className,
      )}
    >
      {children}
    </button>
  )
}

function ColorSwatchControl({
  label,
  value,
  display,
  onChange,
  options,
}: {
  label: string
  value: string
  display: ReactNode
  onChange: (value: string) => void
  options: Array<{ id: string; value: string; label: string }>
}) {
  return (
    <label
      className="note-toolbar-btn note-toolbar-btn--swatch relative"
      title={label}
      aria-label={label}
    >
      {display}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((option) => (
          <option key={option.id} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

export function NoteShortcutHelpDialog({ onClose }: { onClose: () => void }) {
  const shortcuts: Array<{ group: string; rows: Array<[string[], string]> }> = [
    { group: 'Formato y guardado', rows: [
      [['Ctrl', 'B'], 'Aplicar o quitar negrita.'],
      [['Ctrl', 'I'], 'Aplicar o quitar cursiva.'],
      [['Ctrl', 'U'], 'Aplicar o quitar subrayado.'],
      [['Ctrl', 'Z'], 'Deshacer el último cambio.'],
      [['Ctrl', 'Y'], 'Rehacer el último cambio deshecho.'],
      [['Ctrl', 'S'], 'Guardar el apunte. También funciona Ctrl+G.'],
      [['Ctrl', 'O'], 'Abrir Opciones de texto. Con texto seleccionado, edita esa selección; con el cursor, configura el formato para escribir.'],
    ] },
    { group: 'Selección y movimiento', rows: [
      [['Ctrl', 'A'], 'Seleccionar el contenido de la hoja activa.'],
      [['Ctrl', 'Inicio'], 'Ir al principio del documento.'],
      [['Ctrl', 'Fin'], 'Ir al final del documento.'],
      [['↑', '↓'], 'En el borde de una hoja, mover el cursor a la hoja anterior o siguiente.'],
    ] },
    { group: 'Edición del documento', rows: [
      [['Enter'], 'Crear un párrafo nuevo conservando el formato actual.'],
      [['Backspace'], 'Al inicio de un párrafo, unirlo con el anterior; si está vacío, eliminarlo.'],
      [['Supr'], 'Al final de un párrafo, unir el siguiente con el actual.'],
      [['Clic derecho'], 'Abrir las opciones del navegador para copiar, pegar y otras acciones.'],
    ] },
  ]
  const controls: Array<[string, string]> = [
    ['Editar', 'Deshacer y rehacer cambios.'],
    ['Texto', 'Estilo, fuente, tamaño, negrita, cursiva, subrayado, color, resaltado y Aa Formato (Ctrl+O).'],
    ['Párrafo', 'Alineación, interlineado, viñetas y lista numerada.'],
    ['Insertar', 'Imagen, nota destacada y salto de página.'],
    ['Hoja', 'Tamaño de hoja, columnas, numeración, PDF e imprimir.'],
  ]

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-bloomora-deep/35 p-3 backdrop-blur-sm" style={{ zIndex: 100000 }}>
      <section role="dialog" aria-modal="true" aria-labelledby="note-shortcuts-title" className="max-h-[min(90dvh,52rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-bloomora-line/40 bg-[var(--color-bloomora-white)] p-5 shadow-2xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bloomora-rose">Guía rápida</p>
            <h2 id="note-shortcuts-title" className="mt-1 text-xl font-bold text-bloomora-deep">Atajos y controles</h2>
            <p className="mt-1 text-sm text-bloomora-text-muted">Escribe y organiza tus apuntes con movimientos y formato tipo Word.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar ayuda" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-bloomora-line/40 text-bloomora-violet hover:bg-bloomora-lavender-50">×</button>
        </div>
        <div className="grid gap-6">
          <section aria-labelledby="note-shortcuts-keys">
            <h3 id="note-shortcuts-keys" className="mb-3 text-sm font-bold text-bloomora-deep">Atajos del teclado</h3>
            <div className="grid gap-4">
              {shortcuts.map(({ group, rows }) => <section key={group}>
                <h4 className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-bloomora-text-muted">{group}</h4>
                <dl className="grid gap-1.5">
                  {rows.map(([keys, action]) => <div key={keys.join('+')} className={`grid grid-cols-[minmax(7.5rem,30%)_1fr] items-center gap-3 rounded-xl border p-2.5 ${keys.includes('O') ? 'border-bloomora-lilac/50 bg-bloomora-lavender-50/60' : 'border-bloomora-line/25 bg-[var(--color-bloomora-white)]'}`}>
                    <dt className="flex flex-wrap gap-1">{keys.map((key, index) => <span key={`${key}-${index}`} className="flex items-center gap-1">{index > 0 ? <span className="text-[0.65rem] text-bloomora-text-muted">+</span> : null}<kbd className="rounded-md border border-bloomora-line/50 bg-bloomora-snow px-1.5 py-1 text-[0.68rem] font-bold text-bloomora-violet shadow-[0_1px_0_rgba(91,74,140,.12)]">{key}</kbd></span>)}</dt>
                    <dd className="m-0 text-xs leading-relaxed text-bloomora-text-muted">{action}</dd>
                  </div>)}
                </dl>
              </section>)}
            </div>
          </section>

          <section aria-labelledby="note-shortcuts-ctrl-o" className="rounded-2xl border border-bloomora-lilac/30 bg-bloomora-snow/60 p-4">
            <div className="mb-3">
              <h3 id="note-shortcuts-ctrl-o" className="text-sm font-bold text-bloomora-deep">Ctrl+O · Opciones de texto</h3>
              <p className="mt-1 text-xs leading-relaxed text-bloomora-text-muted">Selecciona texto y pulsa Ctrl+O para abrir el panel completo. Si no hay selección, el panel configura el texto que escribirás desde el cursor.</p>
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <figure className="m-0 grid justify-items-center gap-2 rounded-xl border border-bloomora-line/40 bg-[var(--color-bloomora-white)] p-2 shadow-sm">
                <img src={textOptionsScreenshot} alt="Captura real del panel Opciones de texto abierto con Ctrl+O en Bloomora" className="h-auto max-h-[32rem] max-w-full rounded-lg object-contain object-top" />
                <figcaption className="text-center text-[0.68rem] text-bloomora-text-muted">Captura real del panel en modo de escritura.</figcaption>
              </figure>
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-bloomora-violet">Opciones disponibles</h4>
                <dl className="grid gap-1.5">
                  {[
                    ['Texto', 'Aplicar el formato predeterminado para lo que vas a escribir.'],
                    ['Fuente y tamaño', 'Elegir tipografía y ajustar el tamaño con controles o deslizador.'],
                    ['Peso y color', 'Normal, medio o negrita; color de texto y color personalizado.'],
                    ['Alineación', 'Izquierda, centrada, derecha o justificada.'],
                    ['Más abajo', 'Resaltado, interlineado, espacio entre párrafos y mayúsculas/minúsculas.'],
                  ].map(([label, description]) => <div key={label} className="grid grid-cols-[minmax(6rem,32%)_1fr] items-start gap-2 rounded-lg bg-[var(--color-bloomora-white)] p-2.5">
                    <dt className="text-xs font-bold text-bloomora-violet">{label}</dt><dd className="m-0 text-xs leading-relaxed text-bloomora-text-muted">{description}</dd>
                  </div>)}
                </dl>
                <p className="mt-3 rounded-lg bg-bloomora-lavender-50/70 p-3 text-xs leading-relaxed text-bloomora-text-muted">Con una selección, el formato se aplica a ese texto. Sin selección, Ctrl+O abre el panel para configurar el texto que escribirás desde el cursor. Usa la barra de desplazamiento del panel para ver las opciones inferiores.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="note-shortcuts-controls">
            <h3 id="note-shortcuts-controls" className="mb-2 text-sm font-bold text-bloomora-deep">Qué incluye la barra</h3>
            <dl className="grid gap-1.5">{controls.map(([label, description]) => <div key={label} className="grid grid-cols-[minmax(7.5rem,30%)_1fr] items-start gap-3 rounded-xl bg-bloomora-snow/70 p-2.5"><dt className="text-xs font-bold text-bloomora-violet">{label}</dt><dd className="m-0 text-xs leading-relaxed text-bloomora-text-muted">{description}</dd></div>)}</dl>
          </section>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="button" variant="primary" onClick={onClose}>Listo</Button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

function HojaMoreMenu({ props }: { props: NoteToolbarProps }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 8, left: 8, maxHeight: 'calc(100dvh - 1rem)' })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return
    const anchor = trigger.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = window.innerHeight
    const width = Math.min(panel.offsetWidth || 288, viewportWidth - 16)
    const height = Math.min(panel.scrollHeight, viewportHeight - 16)
    let top = anchor.bottom + 8
    if (top + height > viewportHeight - 8) top = anchor.top - height - 8
    top = Math.max(8, Math.min(top, viewportHeight - 16))
    const left = Math.max(8, Math.min(anchor.right - width, viewportWidth - width - 8))
    setPosition({ top, left, maxHeight: `calc(100dvh - ${top + 8}px)` })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="note-hoja-more-panel"
        onClick={() => setOpen((value) => !value)}
        className="note-toolbar-btn"
        title="Más opciones de hoja"
        aria-label="Más opciones de hoja"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open ? createPortal(
        <div
          ref={panelRef}
          id="note-hoja-more-panel"
          role="dialog"
          aria-label="Más opciones de hoja"
          style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 99999, width: 'min(18rem, calc(100vw - 1rem))', maxHeight: position.maxHeight, pointerEvents: 'auto' }}
          className="grid gap-3 overflow-y-auto overscroll-contain rounded-xl border border-bloomora-line/40 bg-[var(--color-bloomora-white)] p-3 shadow-xl"
        >
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={props.pageNumberEnabled ? 'primary' : 'secondary'} size="sm" onClick={() => props.onPageNumberEnabledChange(!props.pageNumberEnabled)} aria-pressed={props.pageNumberEnabled} title="Mostrar número de página">N.º hoja</Button>
            <Button type="button" variant={props.twoColumns ? 'primary' : 'secondary'} size="sm" onClick={() => props.onTwoColumnsChange(!props.twoColumns)} aria-pressed={props.twoColumns} title="Dividir el texto en dos columnas">2 columnas</Button>
          </div>
          <div className="flex gap-2 border-t border-bloomora-line/30 pt-3">
            <Button type="button" variant="secondary" size="sm" fullWidth onClick={props.onExportPdf} title="Exportar a PDF">PDF</Button>
            <Button type="button" variant="secondary" size="sm" fullWidth onClick={props.onPrint} title="Imprimir">Imprimir</Button>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  )
}

const ALIGN_OPTIONS: Array<{ id: NoteTextAlign; label: string }> = [
  { id: 'left', label: 'Izquierda' },
  { id: 'center', label: 'Centrar' },
  { id: 'right', label: 'Derecha' },
  { id: 'justify', label: 'Justificar' },
]

function AlignMenu({
  value,
  onChange,
}: {
  value: NoteTextAlign
  onChange: (align: NoteTextAlign) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 8, left: 8 })

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const anchor = trigger.getBoundingClientRect()
    const width = 11 * 16
    const left = Math.max(8, Math.min(anchor.left, document.documentElement.clientWidth - width - 8))
    setPosition({ top: anchor.bottom + 6, left })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="note-toolbar-btn note-toolbar-btn--text"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Alineación: ${ALIGN_OPTIONS.find((option) => option.id === value)?.label ?? 'Izquierda'}`}
        title="Alineación"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
      >
        <AlignGlyph align={value} />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? createPortal(
        <div
          ref={panelRef}
          role="menu"
          aria-label="Alineación del párrafo"
          style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 99999, width: '11rem' }}
          className="grid gap-1 rounded-xl border border-bloomora-line/40 bg-[var(--color-bloomora-white)] p-1.5 shadow-xl"
        >
          {ALIGN_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={value === option.id}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-left text-sm text-bloomora-deep hover:bg-bloomora-lavender-50',
                value === option.id && 'bg-bloomora-lavender-50 text-bloomora-violet',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.id)
                setOpen(false)
              }}
            >
              <AlignGlyph align={option.id} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      ) : null}
    </>
  )
}

export function NoteToolbar(props: NoteToolbarProps) {
  const resolvedLineHeight = NOTE_LINE_HEIGHTS.reduce(
    (best, value) => Math.abs(value - props.lineHeight) < Math.abs(best - props.lineHeight) ? value : best,
    NOTE_LINE_HEIGHTS[0],
  )

  return (
    <div
      role="toolbar"
      data-note-toolbar
      aria-label="Herramientas de edición del apunte"
      onPointerDownCapture={props.onBeforeControl}
      className="note-toolbar note-toolbar--grouped sticky top-0 z-30"
    >
      <ToolbarGroup label="Editar">
        <ToolbarButton label="Deshacer" shortcut="Ctrl+Z" onClick={props.onUndo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 9h11a5 5 0 010 10h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton label="Rehacer" shortcut="Ctrl+Y" onClick={props.onRedo}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 14l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 9H9a5 5 0 000 10h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Texto">
        <HeadingSelect value={props.paragraphStyle} onChange={props.onParagraphStyleChange} />
        <FontSelect value={props.font} onChange={props.onFontChange} />
        <SizeSelect value={props.fontSizePx} onChange={props.onFontSizeChange} onStep={props.onFontSizeStep} />
        <ToolbarButton label="Negrita" shortcut="Ctrl+B" active={props.active.bold} onClick={props.onBold}><b>B</b></ToolbarButton>
        <ToolbarButton label="Cursiva" shortcut="Ctrl+I" active={props.active.italic} onClick={props.onItalic}><i>I</i></ToolbarButton>
        <ToolbarButton label="Subrayado" shortcut="Ctrl+U" active={props.active.underline} onClick={props.onUnderline}><u>U</u></ToolbarButton>
        <ColorSwatchControl
          label="Color del texto"
          value={props.textColor}
          onChange={props.onTextColor}
          options={ENGLISH_NOTE_COLORS.map((color) => ({ id: color.id, value: color.value, label: color.label }))}
          display={(
            <span className="relative flex flex-col items-center text-[15px] font-extrabold leading-none" aria-hidden>
              A
              <span className="mt-0.5 h-1 w-4 rounded-sm" style={{ backgroundColor: props.textColor }} />
            </span>
          )}
        />
        <ColorSwatchControl
          label="Resaltador"
          value={props.highlightColor ?? ''}
          onChange={(value) => props.onHighlight(value || null)}
          options={[
            { id: 'none', value: '', label: 'Sin resaltado' },
            ...NOTE_HIGHLIGHT_PRESETS.map((color) => ({ id: color.id, value: color.color, label: color.label })),
          ]}
          display={(
            <span className="rounded px-0.5 text-[13px] font-bold" style={{ backgroundColor: props.highlightColor ?? 'transparent' }} aria-hidden>
              Ab
            </span>
          )}
        />
        <ToolbarButton
          label="Aa Formato"
          shortcut="Ctrl+O"
          onClick={props.onOpenTextOptions}
          className="note-toolbar-btn--text"
        >
          <span className="text-[15px] font-bold leading-none tracking-tight" aria-hidden>Aa</span>
          <span className="text-[13px] font-semibold">Formato</span>
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Párrafo">
        <AlignMenu value={props.active.align} onChange={props.onAlign} />
        <label className="note-toolbar-btn note-toolbar-btn--text note-toolbar-lineheight" title="Interlineado" aria-label="Interlineado">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M11 6h10M11 12h10M11 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <select
            aria-label="Interlineado"
            value={resolvedLineHeight}
            onChange={(event) => props.onLineHeightChange(Number(event.target.value))}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {NOTE_LINE_HEIGHTS.map((spacing) => (
              <option key={spacing} value={spacing}>{spacing}</option>
            ))}
          </select>
          <span className="text-[13px] font-semibold tabular-nums">{resolvedLineHeight}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
        <ToolbarButton label="Lista con viñetas" onClick={props.onBulletList}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M10 6h11M10 12h11M10 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="5" cy="6" r="1.4" fill="currentColor" />
            <circle cx="5" cy="12" r="1.4" fill="currentColor" />
            <circle cx="5" cy="18" r="1.4" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton label="Lista numerada" onClick={props.onNumberedList}>
          <span className="text-[13px] font-bold leading-none">1.</span>
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Insertar">
        <ToolbarButton label="Insertar imagen" onClick={props.onInsertImage}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          </svg>
        </ToolbarButton>
        <ToolbarButton label="Insertar nota destacada" onClick={props.onInsertNote}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          label="Salto de página"
          onClick={props.onInsertPageBreak}
          className="note-toolbar-btn--pagebreak"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M7 3h7l5 5v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 21v-5h12v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M2.5 12h2.5M8 12h3M13.5 12h3M19 12h2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Salto de página</span>
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarGroup label="Hoja">
        <label className="note-toolbar-btn note-toolbar-btn--text note-toolbar-pagesize" title="Tamaño de hoja">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <select
            aria-label="Tamaño de hoja"
            value={props.pageSize}
            onChange={(event) => props.onPageSizeChange(event.target.value as EnglishNotePageSize)}
            className={cn(bloomoraSelectClass, 'absolute inset-0 cursor-pointer opacity-0')}
          >
            {ENGLISH_NOTE_PAGE_SIZES.map((size) => (
              <option key={size.id} value={size.id}>{size.shortLabel}</option>
            ))}
          </select>
          <span className="text-[13px] font-semibold">
            {ENGLISH_NOTE_PAGE_SIZES.find((size) => size.id === props.pageSize)?.shortLabel ?? 'Carta'}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
        <HojaMoreMenu props={props} />
      </ToolbarGroup>
    </div>
  )
}
