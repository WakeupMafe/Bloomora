/**
 * Tipos de dominio Bloomora — alineados con `supabase/schema.sql`.
 * PKs bigint y cédula llegan como string desde JSON/PostgREST.
 */

export type Cedula = string
/** bigint identity */
export type RowId = string

export type Profile = {
  cedula: Cedula
  authUserId: string | null
  email: string | null
  username: string | null
  fullName: string | null
  avatarUrl: string | null
  timezone: string
  locale: string
  onboardingCompleted: boolean
  preferredTheme: string
  mascotName: string | null
  createdAt: string
  updatedAt: string
}

export type Category = {
  id: RowId
  userCedula: Cedula
  name: string
  slug: string
  color: string | null
  icon: string | null
  createdAt: string
  updatedAt: string
}

export type DailyPlan = {
  id: RowId
  userCedula: Cedula
  planDate: string
  title: string | null
  notes: string | null
  mood: string | null
  createdAt: string
  updatedAt: string
}

export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived'
export type GoalType = 'habit' | 'target' | 'milestone' | 'project'

export type Goal = {
  id: RowId
  userCedula: Cedula
  categoryId: RowId | null
  title: string
  description: string | null
  status: GoalStatus
  goalType: GoalType
  targetValue: number | null
  currentValue: number
  unit: string | null
  frequency: string | null
  startDate: string | null
  endDate: string | null
  color: string | null
  icon: string | null
  autoMatchEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type GoalMatchRuleType = 'keyword' | 'contains' | 'exact'

export type GoalMatchRule = {
  id: RowId
  userCedula: Cedula
  goalId: RowId
  ruleType: GoalMatchRuleType
  pattern: string
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType = 'simple' | 'block' | 'milestone'
export type TaskSource = 'manual' | 'suggested' | 'recurring' | 'system'

export type Task = {
  id: RowId
  userCedula: Cedula
  dailyPlanId: RowId | null
  categoryId: RowId | null
  title: string
  description: string | null
  notes: string | null
  status: TaskStatus
  priority: TaskPriority
  taskType: TaskType
  source: TaskSource
  color: string | null
  estimatedMinutes: number | null
  actualMinutes: number | null
  isAllDay: boolean
  isFocusBlock: boolean
  isRepeatable: boolean
  autoGoalMatchingEnabled: boolean
  completedAt: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type TaskBlock = {
  id: RowId
  taskId: RowId
  userCedula: Cedula
  blockDate: string
  startAt: string
  endAt: string
  color: string | null
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

export type SubtaskStatus = 'pending' | 'completed' | 'cancelled'

export type Subtask = {
  id: RowId
  taskId: RowId
  userCedula: Cedula
  title: string
  notes: string | null
  status: SubtaskStatus
  sortOrder: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TaskGoalLinkSource =
  | 'manual'
  | 'auto_text'
  | 'rule'
  | 'suggestion_accepted'

export type TaskGoalLink = {
  id: RowId
  userCedula: Cedula
  taskId: RowId
  goalId: RowId
  source: TaskGoalLinkSource
  confidence: number | null
  weight: number
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export type ProgressLogSource =
  | 'task_completion'
  | 'subtask_completion'
  | 'manual_adjustment'
  | 'system'

export type ProgressLog = {
  id: RowId
  userCedula: Cedula
  goalId: RowId
  taskId: RowId | null
  subtaskId: RowId | null
  logDate: string
  valueDelta: number
  source: ProgressLogSource
  note: string | null
  createdAt: string
}

export type TaskCompletionLogSource = 'manual' | 'auto' | 'system'

export type TaskCompletionLog = {
  id: RowId
  userCedula: Cedula
  taskId: RowId
  completedAt: string
  completionDate: string
  source: TaskCompletionLogSource
  createdAt: string
}
