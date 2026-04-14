import type { MockGoalRow } from '@/data/dashboardMock'
import { buildGoalProgressInsights } from '@/features/goals/goalTrackerUtils'
import type { GoalDbRow } from '@/services/supabase/goalsRepo'

function goalPercent(row: GoalDbRow): number {
  if (
    row.percent_display != null &&
    !Number.isNaN(Number(row.percent_display))
  ) {
    return Math.round(Number(row.percent_display))
  }
  const t = row.target_value != null ? Number(row.target_value) : null
  if (t != null && t > 0) {
    return Math.round((Number(row.current_value) / t) * 100)
  }
  return 0
}

function uiVariant(row: GoalDbRow): MockGoalRow['variant'] {
  const v = row.variant as MockGoalRow['variant'] | undefined
  if (v === 'bar' || v === 'days' || v === 'pages') return v
  if (row.goal_type === 'habit') return 'days'
  return 'bar'
}

function uiAccent(row: GoalDbRow): MockGoalRow['accent'] {
  const a = row.accent as MockGoalRow['accent'] | undefined
  if (a === 'lavender' || a === 'green' || a === 'sky') return a
  return 'lavender'
}

export function dbGoalToUi(
  row: GoalDbRow,
  completedDaysByMonth: Record<string, number[]>,
): MockGoalRow {
  const insights = buildGoalProgressInsights(completedDaysByMonth)
  const objetivo = row.target_value != null ? Number(row.target_value) : 30
  const progreso = row.current_value != null ? Number(row.current_value) : 0
  const tipo: MockGoalRow['tipo'] =
    row.goal_type === 'habit'
      ? row.frequency?.startsWith('weekly')
        ? 'frecuencia'
        : 'habito'
      : row.unit === 'horas'
        ? 'tiempo'
        : 'objetivo'
  const frecuencia: MockGoalRow['frecuencia'] =
    row.frequency === 'daily'
      ? 'diario'
      : row.frequency?.startsWith('weekly')
        ? 'semanal'
        : row.frequency === 'monthly'
          ? 'mensual'
          : 'personalizada'
  const estado: MockGoalRow['estado'] =
    row.status === 'completed'
      ? 'Completada'
      : row.status === 'paused'
        ? 'Pausada'
        : 'Activa'
  const categoriaRaw = row.categoria ?? 'Productividad'
  const categoria: MockGoalRow['categoria'] =
    categoriaRaw === 'Salud' ||
    categoriaRaw === 'Finanzas' ||
    categoriaRaw === 'Espiritual' ||
    categoriaRaw === 'Productividad'
      ? categoriaRaw
      : 'Productividad'
  const prioridadRaw = row.prioridad ?? 'Media'
  const prioridad: MockGoalRow['prioridad'] =
    prioridadRaw === 'Alta' || prioridadRaw === 'Baja' || prioridadRaw === 'Media'
      ? prioridadRaw
      : 'Media'

  return {
    id: String(row.id),
    title: row.title,
    percent: goalPercent(row),
    variant: uiVariant(row),
    tipo,
    frecuencia,
    progreso,
    objetivo,
    streak: insights.diasConsecutivos,
    categoria,
    prioridad,
    estado,
    fecha_inicio: row.start_date ?? row.created_at?.slice(0, 10) ?? null,
    fecha_fin: row.end_date ?? null,
    label: row.progress_label ?? undefined,
    accent: uiAccent(row),
    trackerColorId: row.tracker_color_id ?? undefined,
    completedDaysByMonth:
      Object.keys(completedDaysByMonth).length > 0
        ? completedDaysByMonth
        : undefined,
  }
}
