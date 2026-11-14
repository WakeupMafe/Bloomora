import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type WorkspaceToolId = 'pomodoro' | 'english-notes' | 'tabata'
export type WorkspaceToolMode = 'full' | 'minimized' | null

type WorkspaceToolsValue = {
  modes: Record<WorkspaceToolId, WorkspaceToolMode>
  openTool: (tool: WorkspaceToolId, mode?: Exclude<WorkspaceToolMode, null>) => void
  minimizeTool: (tool: WorkspaceToolId) => void
  expandTool: (tool: WorkspaceToolId) => void
  closeTool: (tool: WorkspaceToolId) => void
}

const WorkspaceToolsContext = createContext<WorkspaceToolsValue | null>(null)

const ALL_TOOLS: WorkspaceToolId[] = ['pomodoro', 'english-notes', 'tabata']

function demoteOthers(
  current: Record<WorkspaceToolId, WorkspaceToolMode>,
  keep: WorkspaceToolId,
): Record<WorkspaceToolId, WorkspaceToolMode> {
  const next = { ...current }
  for (const id of ALL_TOOLS) {
    if (id === keep) continue
    if (next[id] === 'full') next[id] = 'minimized'
  }
  return next
}

export function WorkspaceToolsProvider({ children }: { children: ReactNode }) {
  const [modes, setModes] = useState<Record<WorkspaceToolId, WorkspaceToolMode>>({
    pomodoro: null,
    'english-notes': null,
    tabata: null,
  })

  const openTool = useCallback(
    (tool: WorkspaceToolId, mode: Exclude<WorkspaceToolMode, null> = 'full') => {
      setModes((current) => {
        const demoted = demoteOthers(current, tool)
        return { ...demoted, [tool]: mode }
      })
    },
    [],
  )

  const minimizeTool = useCallback((tool: WorkspaceToolId) => {
    setModes((current) => ({ ...current, [tool]: 'minimized' }))
  }, [])

  const expandTool = useCallback((tool: WorkspaceToolId) => {
    setModes((current) => {
      const demoted = demoteOthers(current, tool)
      return { ...demoted, [tool]: 'full' }
    })
  }, [])

  const closeTool = useCallback((tool: WorkspaceToolId) => {
    setModes((current) => ({ ...current, [tool]: null }))
  }, [])

  const value = useMemo(
    () => ({ modes, openTool, minimizeTool, expandTool, closeTool }),
    [modes, openTool, minimizeTool, expandTool, closeTool],
  )

  return (
    <WorkspaceToolsContext.Provider value={value}>
      {children}
    </WorkspaceToolsContext.Provider>
  )
}

export function useWorkspaceTools() {
  const context = useContext(WorkspaceToolsContext)
  if (!context) {
    throw new Error('useWorkspaceTools debe usarse dentro de WorkspaceToolsProvider')
  }
  return context
}
