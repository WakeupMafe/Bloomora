import type { MockGoalRow } from '@/data/dashboardMock'
import {
  buildGoalProgressInsights,
  monthKey,
} from '@/features/goals/goalTrackerUtils'
import type { GoalDbRow } from '@/services/supabase/goalsRepo'

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

/** YYYY-MM-DD en calendario local (igual que toStartDate), nunca UTC de ISO. */
function localYmdFromTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dbGoalToUi(
  row: GoalDbRow,
  completedDaysByMonth: Record<string, number[]>,
): MockGoalRow {
  const insights = buildGoalProgressInsights(completedDaysByMonth)
  const now = new Date()
  const objetivo = row.target_value != null ? Number(row.target_value) : 30
  const progreso = (
    completedDaysByMonth[monthKey(now.getFullYear(), now.getMonth())] ?? []
  ).length
  const percent =
    objetivo > 0 ? Math.min(100, Math.round((progreso / objetivo) * 100)) : 0
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
    description: row.description ?? null,
    percent,
    variant: uiVariant(row),
    tipo,
    frecuencia,
    progreso,
    objetivo,
    streak: insights.diasConsecutivos,
    categoria,
    prioridad,
    estado,
    fecha_inicio: row.start_date ?? localYmdFromTimestamp(row.created_at) ?? null,
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
