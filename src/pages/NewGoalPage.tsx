import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BloomoraLogo } from '@/components/brand/BloomoraLogo'
import { BackButton } from '@/components/navigation/BackButton'
import { Button } from '@/components/ui/Button'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { useInsertGoalMutation } from '@/hooks/useBloomoraGoals'
import type { MockGoalRow } from '@/data/dashboardMock'

type GoalTypeOption =
  | 'habit_daily'
  | 'weekly_frequency'
  | 'target_quantity'
  | 'time_accumulated'

const TYPE_OPTIONS: {
  id: GoalTypeOption
  title: string
  description: string
  emoji: string
}[] = [
  { id: 'habit_daily', title: 'Hábito diario', description: 'Lo marcarás por día', emoji: '🔁' },
  { id: 'weekly_frequency', title: 'Veces por semana', description: 'Ej. 3 veces por semana', emoji: '📅' },
  { id: 'target_quantity', title: 'Meta con objetivo', description: 'Ej. leer 10 páginas o 1.000.000 pasos', emoji: '🎯' },
  { id: 'time_accumulated', title: 'Tiempo acumulado', description: 'Ej. 20 horas de estudio', emoji: '⏱️' },
]

const inputClassName =
  'bloomora-form-input bloomora-new-goal-input mt-1.5 w-full min-h-11 rounded-pill border border-bloomora-line/50 px-4 py-2.5 text-sm font-semibold text-bloomora-deep outline-none ring-bloomora-lilac/25 focus:ring-2'

const selectClassName =
  'bloomora-form-input bloomora-new-goal-select mt-1.5 w-full min-h-11 rounded-pill border border-bloomora-line/50 bg-bloomora-white px-4 py-2.5 text-sm font-semibold text-bloomora-deep'

const ICON_OPTIONS = [
  '🌸',
  '🔥',
  '💪',
  '📚',
  '💧',
  '🧠',
  '🥦',
  '🏋️',
] as const

export function NewGoalPage() {
  const navigate = useNavigate()
  const { showToast } = useBloomoraToast()
  const { cedula } = useUserPhone()
  const insertMut = useInsertGoalMutation(cedula)

  const [title, setTitle] = useState('')
  const [goalType, setGoalType] = useState<GoalTypeOption>('habit_daily')
  const [accent, setAccent] = useState<MockGoalRow['accent']>('lavender')
  const [icon, setIcon] = useState<(typeof ICON_OPTIONS)[number]>('🌸')
  const [durationDays, setDurationDays] = useState('30')
  const [timesPerWeek, setTimesPerWeek] = useState('3')
  const [targetTotal, setTargetTotal] = useState('100')
  const [targetUnit, setTargetUnit] = useState('paginas')
  const [targetHours, setTargetHours] = useState('20')
  const [motivation, setMotivation] = useState('')

  const cleanTitle = title.trim()
  const canSubmit = !!cleanTitle
  const disabledReason = !cleanTitle
    ? 'Escribe el nombre de tu meta para continuar.'
    : null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!cleanTitle) return

    let variant: MockGoalRow['variant'] = 'days'
    let goal_type = 'habit'
    let target_value: number | null = null
    let current_value = 0
    let unit: string | null = null
    let frequency: string | null = null
    let progress_label: string | null = null

    if (goalType === 'habit_daily') {
      const days = Math.max(1, Number(durationDays) || 30)
      variant = 'days'
      goal_type = 'habit'
      frequency = 'daily'
      progress_label = `0 / ${days} dias`
    } else if (goalType === 'weekly_frequency') {
      const weekly = Math.max(1, Number(timesPerWeek) || 3)
      variant = 'days'
      goal_type = 'habit'
      frequency = `weekly:${weekly}`
      progress_label = `0 / ${weekly} veces por semana`
    } else if (goalType === 'target_quantity') {
      const total = Math.max(1, Number(targetTotal) || 100)
      variant = 'bar'
      goal_type = 'target'
      target_value = total
      unit = targetUnit.trim() || 'unidad'
      progress_label = `0 / ${total} ${unit}`
    } else {
      const hours = Math.max(1, Number(targetHours) || 20)
      variant = 'bar'
      goal_type = 'target'
      target_value = hours
      unit = 'horas'
      progress_label = `0 / ${hours} horas`
    }

    insertMut.mutate(
      {
        title: `${icon} ${cleanTitle}`,
        variant,
        accent,
        progress_label,
        percent_display: 0,
        goal_type,
        target_value,
        current_value,
        unit,
        frequency,
      },
      {
        onSuccess: () => {
          showToast('¡Meta guardada!')
          navigate('/app')
        },
      },
    )
  }

  return (
    <div className="bloomora-new-goal-page app-shell-padding app-content-fluid mx-auto flex min-h-dvh flex-col gap-6 bg-bloomora-snow pb-16">
      <header className="flex items-center justify-between gap-4">
        <BloomoraLogo size="sm" />
        <BackButton to="/app" label="Cancelar" className="bloomora-new-goal-cancel" />
      </header>

      <div>
        <h1 className="app-fluid-title font-bold text-bloomora-deep">Nueva meta</h1>
        <p className="mt-1 text-sm text-bloomora-text-muted">
          Crea una meta clara y con progreso real.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bloomora-new-goal-card app-principal-card flex flex-col bg-bloomora-white/95 shadow-bloomora-card ring-1 ring-bloomora-line/50"
      >
        <label className="text-xs font-semibold text-bloomora-text-muted">
          Nombre de tu meta
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClassName}
            placeholder="Ej: Tomar agua 💧"
          />
        </label>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="text-xs font-semibold text-bloomora-text-muted">
            ¿Qué tipo de meta es?
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-2.5">
            {TYPE_OPTIONS.map((opt) => {
              const selected = goalType === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setGoalType(opt.id)}
                  className={`bloomora-new-goal-type-btn border px-4 py-3 text-left transition ${
                    selected
                      ? 'border-bloomora-lilac/70 bg-bloomora-lavender-50/75'
                      : 'border-bloomora-line/45 bg-bloomora-white/85 hover:bg-bloomora-blush/45'
                  }`}
                >
                  <p className="bloomora-new-goal-type-title text-sm font-semibold text-bloomora-deep">
                    {opt.emoji} {opt.title}
                  </p>
                  <p className="bloomora-new-goal-type-desc text-xs text-bloomora-text-muted">
                    {opt.description}
                  </p>
                </button>
              )
            })}
          </div>
        </fieldset>

        {goalType === 'habit_daily' ? (
          <label className="text-xs font-semibold text-bloomora-text-muted">
            ¿Durante cuántos días?
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className={inputClassName}
            />
          </label>
        ) : null}

        {goalType === 'weekly_frequency' ? (
          <label className="text-xs font-semibold text-bloomora-text-muted">
            ¿Veces por semana?
            <input
              type="number"
              min={1}
              max={7}
              value={timesPerWeek}
              onChange={(e) => setTimesPerWeek(e.target.value)}
              className={inputClassName}
            />
          </label>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goalType === 'target_quantity' ? (
            <>
              <label className="text-xs font-semibold text-bloomora-text-muted">
                Meta total
                <input
                  type="number"
                  min={1}
                  value={targetTotal}
                  onChange={(e) => setTargetTotal(e.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="text-xs font-semibold text-bloomora-text-muted">
                Unidad
                <input
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  className={inputClassName}
                  placeholder="páginas / $ / kg"
                />
              </label>
            </>
          ) : null}

          {goalType === 'time_accumulated' ? (
            <label className="text-xs font-semibold text-bloomora-text-muted sm:col-span-2">
              ¿Cuántas horas quieres acumular?
              <input
                type="number"
                min={1}
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                className={inputClassName}
              />
            </label>
          ) : null}

          <label className="text-xs font-semibold text-bloomora-text-muted">
            Color
            <select
              value={accent}
              onChange={(e) => setAccent(e.target.value as MockGoalRow['accent'])}
              className={selectClassName}
            >
              <option value="lavender">Lila</option>
              <option value="green">Verde</option>
              <option value="sky">Cielo</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-bloomora-text-muted">
            Icono
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value as (typeof ICON_OPTIONS)[number])}
              className={selectClassName}
            >
              {ICON_OPTIONS.map((emoji) => (
                <option key={emoji} value={emoji}>
                  {emoji}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-xs font-semibold text-bloomora-text-muted">
          Motivación (opcional)
          <input
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className={inputClassName}
            placeholder="¿Por qué quieres lograr esto?"
          />
        </label>

        <section className="bloomora-new-goal-preview rounded-2xl bg-bloomora-blush/45 p-4 ring-1 ring-bloomora-line/35">
          <p className="text-xs font-semibold text-bloomora-text-muted">
            Así se verá tu meta ✨
          </p>
          <p className="mt-1 text-lg font-bold text-bloomora-deep">
            {icon} {cleanTitle || 'Tu meta'}
          </p>
          <p className="text-sm text-bloomora-text-muted">
            {goalType === 'habit_daily' && `0 / ${Math.max(1, Number(durationDays) || 30)} días`}
            {goalType === 'weekly_frequency' && `0 / ${Math.max(1, Number(timesPerWeek) || 3)} veces por semana`}
            {goalType === 'target_quantity' &&
              `0 / ${Math.max(1, Number(targetTotal) || 100)} ${targetUnit.trim() || 'unidad'}`}
            {goalType === 'time_accumulated' && `0 / ${Math.max(1, Number(targetHours) || 20)} horas`}
          </p>
          {motivation.trim() ? (
            <p className="mt-1 text-xs italic text-bloomora-violet/85">“{motivation.trim()}”</p>
          ) : null}
        </section>

        <Button type="submit" size="lg" fullWidth disabled={!canSubmit || insertMut.isPending}>
          {insertMut.isPending ? 'Guardando…' : 'Crear meta'}
        </Button>
        {!canSubmit && disabledReason ? (
          <p className="bloomora-new-goal-hint text-center text-xs font-medium text-bloomora-text-muted">
            {disabledReason}
          </p>
        ) : null}
      </form>
    </div>
  )
}
