import type { CSSProperties } from 'react'
import {
  DARK_THEME_IDS,
  LIGHT_THEME_IDS,
  THEME_CHROME,
  THEME_META,
  THEME_PALETTES,
  type AppThemeId,
  type ThemePreference,
  isDarkThemeId,
} from '@/theme/bloomoraAppThemes'
import { cn } from '@/utils/cn'

type ThemeSelectorProps = {
  preference: ThemePreference
  effectiveThemeId: AppThemeId
  saving?: boolean
  saved?: boolean
  onChange: (next: ThemePreference) => void
}

function themePreviewStyle(id: AppThemeId): CSSProperties {
  const p = THEME_PALETTES[id]
  const c = THEME_CHROME[id]
  return {
    ['--color-bloomora-snow' as string]: p.snow,
    ['--color-bloomora-mist' as string]: p.mist,
    ['--color-bloomora-lavender-50' as string]: p['lavender-50'],
    ['--color-bloomora-lavender-100' as string]: p['lavender-100'],
    ['--color-bloomora-lilac' as string]: p.lilac,
    ['--color-bloomora-violet' as string]: p.violet,
    ['--color-bloomora-deep' as string]: p.deep,
    ['--color-bloomora-rose' as string]: p.rose,
    ['--color-bloomora-rose-deep' as string]: p['rose-deep'],
    ['--color-bloomora-blush' as string]: p.blush,
    ['--color-bloomora-sky' as string]: p.sky,
    ['--color-bloomora-sky-deep' as string]: p['sky-deep'],
    ['--color-bloomora-text' as string]: p.text,
    ['--color-bloomora-text-muted' as string]: p['text-muted'],
    ['--color-bloomora-white' as string]: p.white,
    ['--color-bloomora-line' as string]: p.line,
    ['--bloomora-btn-from' as string]: c['--bloomora-btn-from'],
    ['--bloomora-btn-to' as string]: c['--bloomora-btn-to'],
    ['--bloomora-on-accent' as string]: c['--bloomora-on-accent'],
    ['--bloomora-progress-from' as string]: c['--bloomora-progress-from'],
    ['--bloomora-progress-to' as string]: c['--bloomora-progress-to'],
    ['--bloomora-success' as string]: c['--bloomora-success'],
  }
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function ThemePreviewCard({ id }: { id: AppThemeId }) {
  return (
    <div
      className="flex h-[104px] flex-col gap-[7px] overflow-hidden rounded-2xl border border-[color:var(--color-bloomora-line)] bg-[color:var(--color-bloomora-snow)] p-2.5"
      style={themePreviewStyle(id)}
    >
      <div className="flex items-center gap-1.5">
        <i
          className="block h-2 rounded-full opacity-90"
          style={{
            width: 28,
            background: 'var(--color-bloomora-rose-deep)',
          }}
        />
        <i
          className="block h-2 rounded-full"
          style={{ width: 20, background: 'var(--color-bloomora-blush)' }}
        />
        <i
          className="block h-2 rounded-full"
          style={{
            width: 16,
            background: 'var(--color-bloomora-lavender-100)',
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 rounded-[11px] border border-[color:var(--color-bloomora-line)] bg-[color:var(--color-bloomora-white)] px-2 py-2">
        <div className="flex items-center gap-1.5">
          <span className="flex-1 truncate text-[11px] font-bold text-[color:var(--color-bloomora-deep)]">
            Tareas
          </span>
          <span
            className="flex h-[18px] items-center rounded-full px-2 text-[9px] font-bold text-[color:var(--bloomora-on-accent)]"
            style={{
              background:
                'linear-gradient(135deg,var(--bloomora-btn-from),var(--bloomora-btn-to))',
            }}
          >
            + Nueva
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-[11px] shrink-0 rounded"
            style={{ background: 'var(--bloomora-success)' }}
          />
          <span className="text-[9.5px] font-semibold text-[color:var(--color-bloomora-text-muted)]">
            Aa · Leer 15 min
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--color-bloomora-lavender-100)]">
            <i
              className="block h-full w-[62%] rounded-full"
              style={{
                background:
                  'linear-gradient(90deg,var(--bloomora-progress-from),var(--bloomora-progress-to))',
              }}
            />
          </span>
        </div>
      </div>
    </div>
  )
}

function ThemeOptionCard({
  id,
  selected,
  disabled,
  onSelect,
}: {
  id: AppThemeId
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const meta = THEME_META[id]
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={meta.label}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'relative rounded-[22px] border-[1.5px] border-bloomora-line bg-bloomora-white px-2 pb-3 pt-2 text-left transition',
        'hover:border-bloomora-lilac disabled:opacity-60',
        selected &&
          'border-2 border-bloomora-rose-deep p-[7px] pb-[11px] shadow-[var(--bloomora-focus-ring)]',
      )}
    >
      {meta.isNew ? (
        <span className="absolute right-3.5 top-3.5 z-[2] flex h-[22px] items-center gap-1 rounded-full bg-[linear-gradient(135deg,var(--bloomora-btn-from),var(--bloomora-btn-to))] px-2.5 text-[11px] font-bold text-[color:var(--bloomora-on-accent)]">
          Nuevo
        </span>
      ) : null}
      <ThemePreviewCard id={id} />
      <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <b className="block text-base text-bloomora-deep">{meta.label}</b>
          <small className="mt-0.5 block text-[13px] font-semibold text-bloomora-text-muted">
            {meta.blurb}
          </small>
        </div>
        <span
          className={cn(
            'grid size-[26px] shrink-0 place-items-center rounded-full border-2 border-bloomora-line',
            selected &&
              'border-bloomora-rose-deep bg-bloomora-rose-deep text-[color:var(--bloomora-on-accent)]',
          )}
          aria-hidden
        >
          {selected ? <CheckIcon /> : null}
        </span>
      </div>
    </button>
  )
}

export function ThemeSelector({
  preference,
  effectiveThemeId,
  saving,
  saved,
  onChange,
}: ThemeSelectorProps) {
  const isAuto = preference.kind === 'auto'
  const lightFav = isAuto ? preference.lightId : 'pink'
  const darkFav = isAuto ? preference.darkId : 'noche'

  const selectFixed = (id: AppThemeId) => {
    onChange({ kind: 'fixed', themeId: id })
  }

  const selectWhileAuto = (id: AppThemeId) => {
    if (!isAuto) {
      selectFixed(id)
      return
    }
    if (isDarkThemeId(id)) {
      onChange({ kind: 'auto', lightId: preference.lightId, darkId: id })
    } else {
      onChange({ kind: 'auto', lightId: id, darkId: preference.darkId })
    }
  }

  const toggleAuto = () => {
    if (isAuto) {
      onChange({ kind: 'fixed', themeId: effectiveThemeId })
      return
    }
    const lightId = isDarkThemeId(effectiveThemeId)
      ? lightFav
      : effectiveThemeId
    const darkId = isDarkThemeId(effectiveThemeId)
      ? effectiveThemeId
      : darkFav
    onChange({
      kind: 'auto',
      lightId: LIGHT_THEME_IDS.includes(lightId) ? lightId : 'pink',
      darkId: DARK_THEME_IDS.includes(darkId) ? darkId : 'noche',
    })
  }

  const selectedId =
    preference.kind === 'fixed' ? preference.themeId : effectiveThemeId

  return (
    <div className="space-y-1">
      <div className="mb-[18px] flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2.5 text-[22px] font-bold text-bloomora-deep">
            <span
              className="text-bloomora-rose-deep"
              aria-hidden
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a9 9 0 100 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5s.9-1.5 2-1.5H17a4 4 0 004-4c0-4.7-4-8.5-9-8.5z" />
                <circle cx="7.5" cy="11" r="1.2" fill="currentColor" />
                <circle cx="10.5" cy="7.5" r="1.2" fill="currentColor" />
                <circle cx="15" cy="7.5" r="1.2" fill="currentColor" />
              </svg>
            </span>
            Tema de la app
          </h3>
          <p className="mt-1 text-[15px] font-medium text-bloomora-text-muted">
            Toca un tema y míralo al instante en toda la app. Se guarda solo en
            tu cuenta.
          </p>
        </div>
        {saved && !saving ? (
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[color:var(--bloomora-success-soft)] px-3.5 text-sm font-bold text-[color:var(--bloomora-success)]">
            <CheckIcon /> Guardado
          </span>
        ) : null}
        {saving ? (
          <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-bloomora-lavender-50 px-3.5 text-sm font-bold text-bloomora-text-muted">
            Guardando…
          </span>
        ) : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isAuto}
        onClick={toggleAuto}
        disabled={saving}
        className={cn(
          'flex w-full items-center gap-4 rounded-[22px] border-[1.5px] border-bloomora-line bg-bloomora-lavender-50 px-[18px] py-4 text-left transition',
          isAuto &&
            'border-[color:var(--bloomora-btn-from)] shadow-[var(--bloomora-focus-ring)]',
        )}
      >
        <div className="flex size-[52px] shrink-0 overflow-hidden rounded-2xl border border-bloomora-line">
          <span
            className="grid flex-1 place-items-center"
            style={{
              ...themePreviewStyle(lightFav),
              background: 'var(--color-bloomora-snow)',
              color: 'var(--color-bloomora-rose-deep)',
            }}
          >
            <SunIcon />
          </span>
          <span
            className="grid flex-1 place-items-center"
            style={{
              ...themePreviewStyle(darkFav),
              background: 'var(--color-bloomora-snow)',
              color: 'var(--color-bloomora-violet)',
            }}
          >
            <MoonIcon />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <b className="block text-base text-bloomora-deep">Automático</b>
          <small className="mt-0.5 block text-sm font-medium text-bloomora-text-muted">
            Sigue el modo claro u oscuro de tu celular o computador
          </small>
          {isAuto ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-bloomora-line bg-bloomora-white px-3 text-sm font-bold text-bloomora-text">
                <SunIcon className="text-bloomora-text-muted" />
                {THEME_META[lightFav].label}
              </span>
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-bloomora-line bg-bloomora-white px-3 text-sm font-bold text-bloomora-text">
                <MoonIcon className="text-bloomora-text-muted" />
                {THEME_META[darkFav].label}
              </span>
            </div>
          ) : null}
        </div>
        <span
          aria-hidden
          className={cn(
            'relative h-[30px] w-[52px] shrink-0 rounded-full border border-bloomora-line bg-bloomora-lavender-100',
            isAuto &&
              'border-transparent bg-[linear-gradient(135deg,var(--bloomora-btn-from),var(--bloomora-btn-to))]',
          )}
        >
          <span
            className={cn(
              'absolute top-[3px] size-[22px] rounded-full bg-bloomora-text-muted transition-[left]',
              isAuto
                ? 'left-[25px] bg-bloomora-white'
                : 'left-[3px]',
            )}
          />
        </span>
      </button>

      <div className="mt-6 mb-3 flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.05em] text-bloomora-text-muted">
        <SunIcon />
        Claros
        <span className="h-px flex-1 bg-bloomora-line" />
      </div>
      <div
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
        role="radiogroup"
        aria-label="Temas claros"
      >
        {LIGHT_THEME_IDS.map((id) => {
          const selected = isAuto
            ? preference.lightId === id
            : selectedId === id
          return (
            <ThemeOptionCard
              key={id}
              id={id}
              selected={selected}
              disabled={saving}
              onSelect={() => selectWhileAuto(id)}
            />
          )
        })}
      </div>

      <div className="mt-6 mb-3 flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.05em] text-bloomora-text-muted">
        <MoonIcon />
        Oscuros
        <span className="h-px flex-1 bg-bloomora-line" />
      </div>
      <div
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
        role="radiogroup"
        aria-label="Temas oscuros"
      >
        {DARK_THEME_IDS.map((id) => {
          const selected = isAuto
            ? preference.darkId === id
            : selectedId === id
          return (
            <ThemeOptionCard
              key={id}
              id={id}
              selected={selected}
              disabled={saving}
              onSelect={() => selectWhileAuto(id)}
            />
          )
        })}
      </div>

      <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-bloomora-lavender-50 px-4 py-3 text-sm font-semibold text-bloomora-text-muted">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="shrink-0"
        >
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
        Los temas oscuros cuidan tus ojos de noche y ahorran batería en pantallas
        OLED.
      </div>

    </div>
  )
}
