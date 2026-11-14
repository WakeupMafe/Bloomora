import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { Button } from '@/components/ui/Button'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { MockGoalRow } from '@/data/dashboardMock'
import { ShareAchievementCard } from '@/features/share-achievement/ShareAchievementCard'
import {
  cardElementToPngBlob,
  downloadBlob,
  shareOrDownloadPng,
  slugifyShareName,
} from '@/features/share-achievement/exportShareCard'
import {
  availableMilestones,
  buildShareStats,
  defaultMilestone,
  milestoneLabel,
} from '@/features/share-achievement/shareAchievementStats'
import type {
  ShareFormat,
  ShareMilestoneKind,
  ShareStyle,
} from '@/features/share-achievement/shareAchievementTypes'
import { SHARE_EXPORT_SIZE } from '@/features/share-achievement/shareAchievementTypes'
import { cn } from '@/utils/cn'

const EXAMPLE_PHOTO_STORY = '/compartir/foto_ejemplo_historia.jpg'
const EXAMPLE_PHOTO_POST = '/compartir/foto_ejemplo_publicacion.jpg'

type ShareAchievementModalProps = {
  open: boolean
  goal: MockGoalRow
  year: number
  monthIndex0: number
  initialKind?: ShareMilestoneKind
  firstName?: string | null
  onClose: () => void
}

export function ShareAchievementModal({
  open,
  goal,
  year,
  monthIndex0,
  initialKind,
  firstName,
  onClose,
}: ShareAchievementModalProps) {
  const { showToast } = useBloomoraToast()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const exportRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const milestones = useMemo(
    () => availableMilestones(goal, year, monthIndex0),
    [goal, year, monthIndex0],
  )

  const [kind, setKind] = useState<ShareMilestoneKind | null>(null)
  const [format, setFormat] = useState<ShareFormat>('story')
  const [style, setStyle] = useState<ShareStyle>('fondo')
  const [customPhoto, setCustomPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [previewMaxW, setPreviewMaxW] = useState(300)

  useEffect(() => {
    if (!open) return
    setKind(defaultMilestone(goal, year, monthIndex0, initialKind))
    setFormat('story')
    setStyle('fondo')
  }, [open, goal, year, monthIndex0, initialKind])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const measure = () => {
      setPreviewMaxW(
        isMobile ? Math.min(300, window.innerWidth - 48) : 320,
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open, isMobile])

  useEffect(() => {
    return () => {
      if (customPhoto?.startsWith('blob:')) URL.revokeObjectURL(customPhoto)
    }
  }, [customPhoto])

  const stats = useMemo(() => {
    if (!kind) return null
    return buildShareStats(goal, kind, year, monthIndex0)
  }, [goal, kind, year, monthIndex0])

  const { width: exportW, height: exportH } = SHARE_EXPORT_SIZE[format]
  const previewH = previewMaxW * (exportH / exportW)
  const scale = previewMaxW / exportW
  const examplePhoto =
    format === 'story' ? EXAMPLE_PHOTO_STORY : EXAMPLE_PHOTO_POST
  const photoUrl =
    style === 'foto' ? customPhoto ?? examplePhoto : null

  const onPickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCustomPhoto((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return url
    })
    setStyle('foto')
  }

  const runExport = async (mode: 'share' | 'download') => {
    if (!exportRef.current || !stats) return
    setBusy(true)
    try {
      // Esperar un frame para que el nodo off-screen pinte
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      const blob = await cardElementToPngBlob(exportRef.current, format)
      const filename = `bloomora-${slugifyShareName(goal.title)}-${format}.png`
      if (mode === 'download') {
        downloadBlob(blob, filename)
        showToast('PNG descargado')
      } else {
        const result = await shareOrDownloadPng(blob, filename)
        showToast(
          result === 'shared' ? 'Listo para compartir' : 'PNG descargado',
        )
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      showToast('No se pudo generar la imagen')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const controls = (
    <div className="flex min-h-0 flex-col gap-4">
      {!isMobile ? (
        <div className="rounded-2xl bg-bloomora-blush/80 px-4 py-3 ring-1 ring-bloomora-rose/30">
          <p className="text-sm font-bold text-bloomora-deep">
            ¡Lo lograste{firstName ? `, ${firstName}` : ''}!
          </p>
          <p className="mt-0.5 text-xs font-medium text-bloomora-violet">
            {goal.title}
            {stats
              ? ` · ${stats.percentLabel} · racha ${stats.currentStreak}`
              : ''}
          </p>
        </div>
      ) : null}

      {milestones.length > 1 ? (
        <div>
          <p className="mb-2 text-sm font-bold text-bloomora-deep">
            Logro a compartir
          </p>
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setKind(m)}
                className={cn(
                  'inline-flex min-h-10 items-center rounded-pill px-3.5 text-sm font-bold transition',
                  kind === m
                    ? 'bg-bloomora-rose-deep text-white'
                    : 'bg-bloomora-mist text-bloomora-violet ring-1 ring-bloomora-line/40',
                )}
              >
                {milestoneLabel(m)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-bold text-bloomora-deep">Formato</p>
        <div className="grid grid-cols-2 gap-2">
          <FormatBtn
            active={format === 'story'}
            label="Historia 9:16"
            onClick={() => setFormat('story')}
          />
          <FormatBtn
            active={format === 'post'}
            label="Publicación 4:5"
            onClick={() => setFormat('post')}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-bloomora-deep">Estilo</p>
        <div className="grid grid-cols-2 gap-2">
          <FormatBtn
            active={style === 'fondo'}
            label="Con fondo"
            onClick={() => setStyle('fondo')}
          />
          <FormatBtn
            active={style === 'foto'}
            label="Sobre foto"
            onClick={() => setStyle('foto')}
          />
        </div>
        {style === 'foto' ? (
          <button
            type="button"
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-bloomora-line/50 bg-white px-3 text-sm font-bold text-bloomora-violet"
            onClick={() => fileRef.current?.click()}
          >
            Usar una foto mía (opcional)
          </button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickPhoto}
        />
      </div>

      <p className="rounded-2xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
        ✨ Lista para subir tal cual a tu historia o a tu feed.
      </p>

      <div className="mt-auto grid gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          className="h-[52px] text-base font-bold"
          disabled={busy || !stats}
          onClick={() => void runExport('share')}
        >
          Compartir
        </Button>
        <Button
          variant="primary"
          className="h-[52px] bg-bloomora-rose-deep text-base font-bold text-white hover:bg-bloomora-rose-deep/90"
          disabled={busy || !stats}
          onClick={() => void runExport('download')}
        >
          Descargar PNG
        </Button>
      </div>
    </div>
  )

  const preview = (
    <div className="flex min-h-0 flex-col">
      <p className="mb-2 text-center text-xs font-semibold text-bloomora-violet">
        Vista previa
        {style === 'foto' && !customPhoto ? ' · foto de ejemplo' : ''} ·{' '}
        {exportW} × {exportH}
      </p>
      <div
        className="relative mx-auto overflow-hidden rounded-[1.25rem] bg-bloomora-lavender-50 ring-1 ring-bloomora-line/30"
        style={{ width: previewMaxW, height: previewH }}
      >
        {stats ? (
          <ShareAchievementCard
            stats={stats}
            format={format}
            style={style}
            photoUrl={photoUrl}
            previewScale={scale}
          />
        ) : (
          <p className="flex h-full items-center justify-center p-4 text-center text-sm text-bloomora-text-muted">
            Aún no hay un logro para compartir este mes. Marca más días en el
            tracker.
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[10085] flex items-end justify-center bg-bloomora-deep/40 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Nodo a escala 1 para export nítido */}
      {stats ? (
        <div
          aria-hidden
          className="pointer-events-none fixed left-[-12000px] top-0 opacity-0"
        >
          <ShareAchievementCard
            ref={exportRef}
            stats={stats}
            format={format}
            style={style}
            photoUrl={photoUrl}
          />
        </div>
      ) : null}

      <div
        className={cn(
          'flex max-h-[min(94dvh,920px)] w-full flex-col overflow-hidden bg-white shadow-2xl',
          isMobile ? 'rounded-t-[1.75rem]' : 'max-w-5xl rounded-[1.75rem]',
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-bloomora-line/30 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="share-modal-title"
              className="text-lg font-bold text-bloomora-deep sm:text-xl"
            >
              Compartir mi logro
            </h2>
            <p className="mt-0.5 text-sm font-medium text-bloomora-violet">
              {isMobile
                ? `${goal.title}${stats ? ` · ${stats.badge}` : ''}`
                : 'Celebra tu avance en Instagram o WhatsApp'}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-bloomora-violet hover:bg-bloomora-mist"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6',
            !isMobile && 'grid grid-cols-[1fr_1.05fr] gap-6',
          )}
        >
          {isMobile ? (
            <>
              {preview}
              <div className="mt-5">{controls}</div>
            </>
          ) : (
            <>
              {preview}
              {controls}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FormatBtn({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-2xl px-3 text-sm font-bold transition',
        active
          ? 'bg-white text-bloomora-deep ring-2 ring-bloomora-rose-deep'
          : 'bg-bloomora-mist text-bloomora-violet ring-1 ring-bloomora-line/35',
      )}
    >
      {label}
    </button>
  )
}
