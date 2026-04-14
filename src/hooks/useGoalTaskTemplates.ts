import { useCallback, useEffect, useMemo, useState } from 'react'

function storageKey(cedula: string) {
  return `bloomora:goal-task-templates:${cedula}`
}

function readTemplateIds(cedula: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(cedula))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string' && !!x.trim())
  } catch {
    return []
  }
}

function writeTemplateIds(cedula: string, ids: string[]) {
  localStorage.setItem(storageKey(cedula), JSON.stringify(ids))
}

export function useGoalTaskTemplates(cedula: string | null) {
  const [templateIds, setTemplateIds] = useState<string[]>(() =>
    cedula ? readTemplateIds(cedula) : [],
  )

  useEffect(() => {
    setTemplateIds(cedula ? readTemplateIds(cedula) : [])
  }, [cedula])

  const toggleTemplate = useCallback(
    (goalId: string) => {
      if (!cedula) return
      setTemplateIds((prev) => {
        const next = prev.includes(goalId)
          ? prev.filter((id) => id !== goalId)
          : [...prev, goalId]
        writeTemplateIds(cedula, next)
        return next
      })
    },
    [cedula],
  )

  const isTemplate = useCallback(
    (goalId: string) => templateIds.includes(goalId),
    [templateIds],
  )

  return useMemo(
    () => ({ templateIds, isTemplate, toggleTemplate }),
    [templateIds, isTemplate, toggleTemplate],
  )
}
