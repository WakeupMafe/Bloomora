import type { SupabaseClient } from '@supabase/supabase-js'
import { bogotaWallToIso, isoToMinutesBogota } from '@/utils/bogotaTime'
import { ensureGoalDayMark } from '@/services/supabase/goalMarksRepo'

export type AgendaTaskRow = {
  id: number
  title: string
  start_min: number
  end_min: number
  completed: boolean
  sort_order: number
}

function isAuthLikeError(error: unknown): boolean {
  const msg =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : ''
  return (
    msg.toLowerCase().includes('unauthorized') ||
    msg.toLowerCase().includes('jwt') ||
    msg.toLowerCase().includes('permission') ||
    msg.toLowerCase().includes('forbidden')
  )
}

async function getOrCreateDailyPlanId(
  sb: SupabaseClient,
  userCedula: string,
  planDate: string,
): Promise<number> {
  const { data: existing, error: selErr } = await sb
    .from('daily_plans')
    .select('id')
    .eq('user_cedula', userCedula)
    .eq('plan_date', planDate)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing?.id != null) return existing.id as number

  const { data, error } = await sb
    .from('daily_plans')
    .insert({ user_cedula: userCedula, plan_date: planDate })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: number }).id
}

export async function listAgendaTasks(
  sb: SupabaseClient,
  userCedula: string,
  taskDate: string,
): Promise<AgendaTaskRow[]> {
  const { data: plan, error: pErr } = await sb
    .from('daily_plans')
    .select('id')
    .eq('user_cedula', userCedula)
    .eq('plan_date', taskDate)
    .maybeSingle()
  if (pErr) throw pErr
  if (!plan?.id) return []

  const planId = plan.id as number
  const { data: tasks, error: tErr } = await sb
    .from('tasks')
    .select('id, title, status, sort_order')
    .eq('daily_plan_id', planId)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (tErr) throw tErr
  if (!tasks?.length) return []

  const taskIds = (tasks as { id: number }[]).map((t) => t.id)
  const { data: blocks, error: bErr } = await sb
    .from('task_blocks')
    .select('task_id, start_at, end_at')
    .eq('user_cedula', userCedula)
    .eq('block_date', taskDate)
    .in('task_id', taskIds)
    .order('start_at', { ascending: true })
  if (bErr) throw bErr

  const firstBlockByTask = new Map<
    number,
    { start_at: string; end_at: string }
  >()
  for (const b of blocks ?? []) {
    const row = b as { task_id: number; start_at: string; end_at: string }
    if (!firstBlockByTask.has(row.task_id)) {
      firstBlockByTask.set(row.task_id, {
        start_at: row.start_at,
        end_at: row.end_at,
      })
    }
  }

  const defaultStart = 9 * 60
  const defaultEnd = 10 * 60

  return (tasks as { id: number; title: string; status: string; sort_order: number }[]).map(
    (t) => {
      const blk = firstBlockByTask.get(t.id)
      const startMin = blk ? isoToMinutesBogota(blk.start_at) : defaultStart
      const endMin = blk ? isoToMinutesBogota(blk.end_at) : defaultEnd
      return {
        id: t.id,
        title: t.title,
        start_min: startMin,
        end_min: Math.max(endMin, startMin + 15),
        completed: t.status === 'completed',
        sort_order: t.sort_order ?? 0,
      }
    },
  )
}

export async function insertAgendaTask(
  sb: SupabaseClient,
  row: {
    user_cedula: string
    task_date: string
    title: string
    start_min: number
    end_min: number
    completed?: boolean
    sort_order?: number
    goal_id?: number
  },
): Promise<number> {
  const planId = await getOrCreateDailyPlanId(
    sb,
    row.user_cedula,
    row.task_date,
  )

  const { data: existingTasks, error: cErr } = await sb
    .from('tasks')
    .select('sort_order')
    .eq('daily_plan_id', planId)
    .order('sort_order', { ascending: false })
    .limit(1)
  if (cErr) throw cErr
  const maxSort =
    existingTasks?.length && existingTasks[0]
      ? Number((existingTasks[0] as { sort_order: number }).sort_order)
      : -1
  const sortOrder = row.sort_order ?? maxSort + 1

  const completed = row.completed ?? false
  const { data: taskRow, error: insErr } = await sb
    .from('tasks')
    .insert({
      user_cedula: row.user_cedula,
      daily_plan_id: planId,
      title: row.title.trim(),
      status: completed ? 'completed' : 'pending',
      task_type: 'simple',
      sort_order: sortOrder,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .select('id')
    .single()
  if (insErr) throw insErr
  const taskId = (taskRow as { id: number }).id

  try {
    const { error: blkErr } = await sb.from('task_blocks').insert({
      task_id: taskId,
      user_cedula: row.user_cedula,
      block_date: row.task_date,
      start_at: bogotaWallToIso(row.task_date, row.start_min),
      end_at: bogotaWallToIso(row.task_date, row.end_min),
    })
    if (blkErr) throw blkErr

    if (row.goal_id != null) {
      const { error: linkErr } = await sb.from('task_goal_links').insert({
        user_cedula: row.user_cedula,
        task_id: taskId,
        goal_id: row.goal_id,
        source: 'manual',
        weight: 1,
        is_primary: true,
      })
      if (linkErr) {
        if (isAuthLikeError(linkErr)) {
          throw new Error(
            'No autorizado para vincular tareas con metas (tabla task_goal_links). Ejecuta la migración RLS de modo simple para task_goal_links.',
          )
        }
        throw linkErr
      }
    }

    return taskId
  } catch (err) {
    // Evita estado inconsistente: si falla el vínculo o el bloque, no dejamos
    // una tarea huérfana visible como "guardada".
    await sb.from('tasks').delete().eq('id', taskId)
    throw err
  }
}

export async function updateAgendaTask(
  sb: SupabaseClient,
  taskId: number,
  planDate: string,
  patch: Partial<
    Pick<AgendaTaskRow, 'title' | 'start_min' | 'end_min' | 'completed' | 'sort_order'>
  >,
) {
  if (patch.title !== undefined || patch.sort_order !== undefined) {
    const taskPatch: Record<string, unknown> = {}
    if (patch.title !== undefined) taskPatch.title = patch.title.trim()
    if (patch.sort_order !== undefined) taskPatch.sort_order = patch.sort_order
    if (Object.keys(taskPatch).length > 0) {
      const { error } = await sb.from('tasks').update(taskPatch).eq('id', taskId)
      if (error) throw error
    }
  }

  if (patch.completed !== undefined) {
    const { error } = await sb
      .from('tasks')
      .update({
        status: patch.completed ? 'completed' : 'pending',
        completed_at: patch.completed ? new Date().toISOString() : null,
      })
      .eq('id', taskId)
    if (error) throw error
  }

  if (patch.start_min !== undefined || patch.end_min !== undefined) {
    const { data: blk, error: fErr } = await sb
      .from('task_blocks')
      .select('id, start_at, end_at')
      .eq('task_id', taskId)
      .eq('block_date', planDate)
      .order('start_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (fErr) throw fErr

    const startMin =
      patch.start_min ??
      (blk ? isoToMinutesBogota((blk as { start_at: string }).start_at) : 9 * 60)
    const endMin =
      patch.end_min ??
      (blk ? isoToMinutesBogota((blk as { end_at: string }).end_at) : 10 * 60)

    if (blk?.id != null) {
      const { error } = await sb
        .from('task_blocks')
        .update({
          start_at: bogotaWallToIso(planDate, startMin),
          end_at: bogotaWallToIso(planDate, Math.max(endMin, startMin + 15)),
        })
        .eq('id', (blk as { id: number }).id)
      if (error) throw error
    } else {
      const { data: trow, error: tErr } = await sb
        .from('tasks')
        .select('user_cedula')
        .eq('id', taskId)
        .single()
      if (tErr) throw tErr
      const userCedula = (trow as { user_cedula: string }).user_cedula
      const { error } = await sb.from('task_blocks').insert({
        task_id: taskId,
        user_cedula: userCedula,
        block_date: planDate,
        start_at: bogotaWallToIso(planDate, startMin),
        end_at: bogotaWallToIso(planDate, Math.max(endMin, startMin + 15)),
      })
      if (error) throw error
    }
  }
}

export async function deleteAgendaTask(sb: SupabaseClient, id: number) {
  const { error } = await sb.from('tasks').delete().eq('id', id)
  if (error) throw error
}

/** Fila de `public.subtasks` para la agenda. */
export type AgendaSubtaskRow = {
  id: number
  task_id: number
  title: string
  status: string
  sort_order: number
}

export async function listSubtasksForTaskIds(
  sb: SupabaseClient,
  userCedula: string,
  taskIds: number[],
): Promise<AgendaSubtaskRow[]> {
  if (taskIds.length === 0) return []
  const { data, error } = await sb
    .from('subtasks')
    .select('id, task_id, title, status, sort_order')
    .eq('user_cedula', userCedula)
    .in('task_id', taskIds)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as AgendaSubtaskRow[]
}

export async function insertAgendaSubtask(
  sb: SupabaseClient,
  userCedula: string,
  taskId: number,
  title: string,
): Promise<number> {
  const trimmed = title.trim()
  if (!trimmed) throw new Error('El paso no puede estar vacío.')

  const { data: maxRow, error: maxErr } = await sb
    .from('subtasks')
    .select('sort_order')
    .eq('task_id', taskId)
    .eq('user_cedula', userCedula)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (maxErr) throw maxErr
  const nextOrder =
    maxRow != null
      ? Number((maxRow as { sort_order: number }).sort_order) + 1
      : 0

  const { data, error } = await sb
    .from('subtasks')
    .insert({
      user_cedula: userCedula,
      task_id: taskId,
      title: trimmed,
      status: 'pending',
      sort_order: nextOrder,
    })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: number }).id
}

export async function setAgendaSubtaskCompleted(
  sb: SupabaseClient,
  userCedula: string,
  subtaskId: number,
  completed: boolean,
) {
  const { error } = await sb
    .from('subtasks')
    .update({
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', subtaskId)
    .eq('user_cedula', userCedula)
  if (error) throw error
}

export async function deleteAgendaSubtask(
  sb: SupabaseClient,
  userCedula: string,
  subtaskId: number,
) {
  const { error } = await sb
    .from('subtasks')
    .delete()
    .eq('id', subtaskId)
    .eq('user_cedula', userCedula)
  if (error) throw error
}

export async function markLinkedGoalsDoneForDay(
  sb: SupabaseClient,
  params: {
    userCedula: string
    taskId: number
    dayKey: string
  },
) {
  const { userCedula, taskId, dayKey } = params
  const yearMonth = dayKey.slice(0, 7)
  const day = Number(dayKey.slice(8, 10))
  if (!yearMonth || !Number.isFinite(day) || day < 1 || day > 31) return

  const { data: links, error: linksErr } = await sb
    .from('task_goal_links')
    .select('goal_id')
    .eq('user_cedula', userCedula)
    .eq('task_id', taskId)
  if (linksErr) throw linksErr
  if (!links?.length) return

  const marks = (links as { goal_id: number }[]).map((l) => ({
    goalId: l.goal_id,
    userCedula,
    yearMonth,
    day,
  }))
  for (const mark of marks) {
    await ensureGoalDayMark(sb, mark)
  }
}
