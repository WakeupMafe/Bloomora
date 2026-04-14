/** Vista de dashboard antes de conectar Supabase — reemplazar por queries reales. */

export type AgendaSubtask = {
  id: string
  title: string
  completed: boolean
}

export type AgendaTask = {
  id: string
  title: string
  /** minutos desde medianoche */
  startMin: number
  endMin: number
  completed: boolean
  /** Pasos opcionales (tabla `subtasks` en Supabase). */
  subtasks: AgendaSubtask[]
}

export type MockGoalRow = {
  id: string
  title: string
  percent: number
  variant: 'bar' | 'days' | 'pages'
  tipo: 'habito' | 'frecuencia' | 'objetivo' | 'tiempo'
  frecuencia: 'diario' | 'semanal' | 'mensual' | 'personalizada'
  progreso: number
  objetivo: number
  streak: number
  categoria: 'Salud' | 'Finanzas' | 'Espiritual' | 'Productividad'
  prioridad: 'Alta' | 'Media' | 'Baja'
  estado: 'Activa' | 'Pausada' | 'Completada'
  fecha_inicio: string | null
  fecha_fin: string | null
  label?: string
  accent: 'lavender' | 'green' | 'sky'
  /**
   * Días completados por mes (`YYYY-MM` → días 1–31).
   * Cada mes tiene su propio estado en el tracker.
   */
  completedDaysByMonth?: Record<string, number[]>
  /** Id de paleta (`p01`…`p18`, `v01`…`v12`) para días completados en el tracker. */
  trackerColorId?: string
}

export const mockProfileFirstName = 'Mafe'

/** Demo perfil — sustituir por usuario autenticado. */
export const mockProfileEmail = 'mafe123@email.com'

/** Semilla solo para el día “hoy” al cargar (resto de días vacíos). */
export const mockTodayTasksSeed: AgendaTask[] = [
  {
    id: '1',
    title: 'Meditar y Orar',
    startMin: 5 * 60 + 30,
    endMin: 6 * 60,
    completed: true,
    subtasks: [],
  },
  {
    id: '2',
    title: 'Organizar habitación',
    startMin: 6 * 60,
    endMin: 6 * 60 + 30,
    completed: true,
    subtasks: [],
  },
  {
    id: '3',
    title: 'Rutina de Skin Care',
    startMin: 6 * 60 + 30,
    endMin: 7 * 60,
    completed: false,
    subtasks: [],
  },
  {
    id: '4',
    title: 'Trabajar en proyecto',
    startMin: 7 * 60 + 30,
    endMin: 16 * 60 + 30,
    completed: false,
    subtasks: [],
  },
]

/** Primera tarea del día si no hay ninguna (5:30). */
export const defaultFirstBlockStartMin = 5 * 60 + 30

export const defaultNewBlockDurationMin = 30

export const mockGoalsOverallPercent = 60

export const mockGoalRows: MockGoalRow[] = [
  {
    id: 'g1',
    title: 'Estudiar Inglés',
    percent: 45,
    variant: 'bar',
    tipo: 'objetivo',
    frecuencia: 'diario',
    progreso: 45,
    objetivo: 100,
    streak: 3,
    categoria: 'Productividad',
    prioridad: 'Alta',
    estado: 'Activa',
    fecha_inicio: '2026-04-01',
    fecha_fin: null,
    accent: 'lavender',
  },
  {
    id: 'g2',
    title: 'Hacer Ejercicio',
    percent: 60,
    variant: 'days',
    tipo: 'habito',
    frecuencia: 'diario',
    progreso: 3,
    objetivo: 5,
    streak: 2,
    categoria: 'Salud',
    prioridad: 'Alta',
    estado: 'Activa',
    fecha_inicio: '2026-04-01',
    fecha_fin: null,
    label: '3 / 5 días',
    accent: 'green',
  },
  {
    id: 'g3',
    title: 'Leer un Libro',
    percent: 60,
    variant: 'pages',
    tipo: 'objetivo',
    frecuencia: 'diario',
    progreso: 120,
    objetivo: 200,
    streak: 4,
    categoria: 'Productividad',
    prioridad: 'Media',
    estado: 'Activa',
    fecha_inicio: '2026-04-01',
    fecha_fin: null,
    label: '120 / 200 páginas',
    accent: 'sky',
  },
]
