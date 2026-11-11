import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import textOptionsScreenshot from '@/assets/notes/ctrl-o-opciones-texto.png'
import { Button } from '@/components/ui/Button'
import { bloomoraSelectClass } from '@/components/ui/formControls'
import { NoteBlock } from '@/features/notes/NoteBlock'
import { FontSelect } from '@/features/notes/FontSelect'
import { HeadingSelect } from '@/features/notes/HeadingSelect'
import { SizeSelect } from '@/features/notes/SizeSelect'
import { NOTE_HIGHLIGHT_PRESETS } from '@/features/notes/noteTextOptionsConstants'
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
  pageSize: EnglishNotePageSize
  onPageSizeChange: (v: EnglishNotePageSize) => void
  pageNumberEnabled: boolean
  onPageNumberEnabledChange: (enabled: boolean) => void
  twoColumns: boolean
  onTwoColumnsChange: (enabled: boolean) => void
  onBeforeControl: () => void
}

function Separator() {
  return <span className="mx-0.5 h-7 w-px shrink-0 bg-bloomora-line/60" aria-hidden />
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
    <Button
      type="button"
      variant={active ? 'primary' : 'secondary'}
      size="sm"
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn('!min-h-9 !min-w-9 !px-2', className)}
    >
      {children}
    </Button>
  )
}

function SaveIcon() {
  return <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 4h12l3 3v13H4V4h1Zm2 0v6h9V4M7 20v-7h10v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
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
    ['Párrafo', 'Estilo normal o títulos 1–3, alineación y listas.'],
    ['Texto', 'Fuente, tamaño, negrita, cursiva, subrayado, tachado, color y resaltado.'],
    ['Organización', 'Insertar bloques de Nota, imágenes y saltos de hoja.'],
    ['Más', 'Cambiar tamaño de hoja, numeración y columnas; exportar PDF e imprimir.'],
  ]

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-bloomora-deep/35 p-3 backdrop-blur-sm" style={{ zIndex: 100000 }}>
      <section role="dialog" aria-modal="true" aria-labelledby="note-shortcuts-title" className="max-h-[min(90dvh,52rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-bloomora-line/40 bg-white p-5 shadow-2xl sm:p-7">
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
                  {rows.map(([keys, action]) => <div key={keys.join('+')} className={`grid grid-cols-[minmax(7.5rem,30%)_1fr] items-center gap-3 rounded-xl border p-2.5 ${keys.includes('O') ? 'border-bloomora-lilac/50 bg-bloomora-lavender-50/60' : 'border-bloomora-line/25 bg-white'}`}>
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
              <figure className="m-0 grid justify-items-center gap-2 rounded-xl border border-bloomora-line/40 bg-white p-2 shadow-sm">
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
                  ].map(([label, description]) => <div key={label} className="grid grid-cols-[minmax(6rem,32%)_1fr] items-start gap-2 rounded-lg bg-white p-2.5">
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

function MoreToolsMenu({ props }: { props: NoteToolbarProps }) {
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
        aria-controls="note-more-tools-panel"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-bloomora-line/50 bg-white px-3 text-xs font-semibold text-bloomora-violet hover:bg-bloomora-lavender-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bloomora-lilac"
        title="Más herramientas"
      >
        Más <span aria-hidden>⌄</span>
      </button>
      {open ? createPortal(
        <div
          ref={panelRef}
          id="note-more-tools-panel"
          role="dialog"
          aria-label="Más herramientas del apunte"
          style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 99999, width: 'min(18rem, calc(100vw - 1rem))', maxHeight: position.maxHeight, pointerEvents: 'auto' }}
          className="grid gap-3 overflow-y-auto overscroll-contain rounded-xl border border-bloomora-line/40 bg-white p-3 shadow-xl"
        >
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-bloomora-deep">
            Tamaño de hoja
            <select value={props.pageSize} onChange={(event) => props.onPageSizeChange(event.target.value as EnglishNotePageSize)} className={cn(bloomoraSelectClass, '!min-h-9 w-auto rounded-lg px-2 py-1 text-xs')}>
              {ENGLISH_NOTE_PAGE_SIZES.map((size) => <option key={size.id} value={size.id}>{size.shortLabel}</option>)}
            </select>
          </label>
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

export function NoteToolbar(props: NoteToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Herramientas de edición del apunte"
      onPointerDownCapture={props.onBeforeControl}
      className="sticky top-0 z-30 -mx-1 flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-bloomora-line/30 bg-white/95 p-1.5 shadow-[0_5px_18px_-12px_rgba(91,74,140,0.3)] backdrop-blur supports-[backdrop-filter]:bg-white/90 [scrollbar-width:thin]"
    >
      <div role="group" aria-label="Deshacer y rehacer" className="flex shrink-0 items-center gap-1">
        <ToolbarButton label="Deshacer" shortcut="Ctrl+Z" onClick={props.onUndo}>↶</ToolbarButton>
        <ToolbarButton label="Rehacer" shortcut="Ctrl+Y" onClick={props.onRedo}>↷</ToolbarButton>
      </div>
      <Separator />

      <div role="group" aria-label="Estilo, fuente y tamaño" className="flex shrink-0 items-center gap-1">
        <HeadingSelect value={props.paragraphStyle} onChange={props.onParagraphStyleChange} />
        <FontSelect value={props.font} onChange={props.onFontChange} />
        <SizeSelect value={props.fontSizePx} onChange={props.onFontSizeChange} onStep={props.onFontSizeStep} />
      </div>
      <Separator />

      <div role="group" aria-label="Formato de texto" className="flex shrink-0 items-center gap-1">
        <ToolbarButton label="Negrita" shortcut="Ctrl+B" active={props.active.bold} onClick={props.onBold}><b>B</b></ToolbarButton>
        <ToolbarButton label="Cursiva" shortcut="Ctrl+I" active={props.active.italic} onClick={props.onItalic}><i>I</i></ToolbarButton>
        <ToolbarButton label="Subrayado" shortcut="Ctrl+U" active={props.active.underline} onClick={props.onUnderline}><u>U</u></ToolbarButton>
        <ToolbarButton label="Tachado" active={props.active.strike} onClick={props.onStrike}><s>S</s></ToolbarButton>
        <label className="relative flex h-9 min-w-9 items-center justify-center rounded-lg border border-bloomora-line/45 bg-white px-1.5 text-sm font-bold text-bloomora-deep hover:bg-bloomora-lavender-50" title="Color del texto" aria-label="Color del texto">
          <span aria-hidden>A</span><span className="absolute bottom-1 left-2 right-2 h-1 rounded-full" style={{ backgroundColor: props.textColor }} aria-hidden />
          <select aria-label="Color del texto" value={props.textColor} onChange={(event) => props.onTextColor(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
            {ENGLISH_NOTE_COLORS.map((color) => <option key={color.id} value={color.value}>{color.label}</option>)}
          </select>
        </label>
        <label className="relative flex h-9 min-w-9 items-center justify-center rounded-lg border border-bloomora-line/45 bg-white px-1.5 text-sm font-bold text-bloomora-deep hover:bg-bloomora-lavender-50" title="Resaltador" aria-label="Resaltador">
          <span className="rounded px-1" style={{ backgroundColor: props.highlightColor ?? 'transparent' }} aria-hidden>Ab</span>
          <select aria-label="Color de resaltado" value={props.highlightColor ?? ''} onChange={(event) => props.onHighlight(event.target.value || null)} className="absolute inset-0 cursor-pointer opacity-0">
            <option value="">Sin resaltado</option>
            {NOTE_HIGHLIGHT_PRESETS.map((color) => <option key={color.id} value={color.color}>{color.label}</option>)}
          </select>
        </label>
      </div>
      <Separator />

      <div role="group" aria-label="Alineación" className="flex shrink-0 items-center gap-1">
        {(['left', 'center', 'right', 'justify'] as const).map((align) => (
          <ToolbarButton key={align} label={{ left: 'Alinear a la izquierda', center: 'Centrar', right: 'Alinear a la derecha', justify: 'Justificar' }[align]} active={props.active.align === align} onClick={() => props.onAlign(align)}>
            <AlignGlyph align={align} />
          </ToolbarButton>
        ))}
      </div>
      <Separator />

      <div role="group" aria-label="Listas y destacados" className="flex shrink-0 items-center gap-1">
        <ToolbarButton label="Lista con viñetas" onClick={props.onBulletList}>☷</ToolbarButton>
        <ToolbarButton label="Lista numerada" onClick={props.onNumberedList}>1.</ToolbarButton>
        <NoteBlock onInsert={props.onInsertNote} />
      </div>
      <Separator />

      <div role="group" aria-label="Insertar contenido" className="flex shrink-0 items-center gap-1">
        <ToolbarButton label="Insertar imagen" onClick={props.onInsertImage}>▧</ToolbarButton>
        <ToolbarButton label="Insertar salto de hoja" onClick={props.onInsertPageBreak}>↵</ToolbarButton>
      </div>
      <Separator />

      <MoreToolsMenu props={props} />

      <Button type="button" variant="primary" size="sm" onMouseDown={(event) => event.preventDefault()} onClick={props.onSave} title="Guardar apunte (Ctrl+S o Ctrl+G)" className="ml-auto shrink-0 gap-1.5">
        <SaveIcon /><span>Guardar</span>
      </Button>
    </div>
  )
}
