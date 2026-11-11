import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type WorkspaceToolId = 'pomodoro' | 'english-notes'
export type WorkspaceToolMode = 'full' | 'minimized' | null

type WorkspaceToolsValue = {
  modes: Record<WorkspaceToolId, WorkspaceToolMode>
  openTool: (tool: WorkspaceToolId, mode?: Exclude<WorkspaceToolMode, null>) => void
  minimizeTool: (tool: WorkspaceToolId) => void
  expandTool: (tool: WorkspaceToolId) => void
}

const WorkspaceToolsContext = createContext<WorkspaceToolsValue | null>(null)

export function WorkspaceToolsProvider({ children }: { children: ReactNode }) {
  const [modes, setModes] = useState<Record<WorkspaceToolId, WorkspaceToolMode>>({
    pomodoro: null,
    'english-notes': null,
  })

  const openTool = useCallback((tool: WorkspaceToolId, mode: Exclude<WorkspaceToolMode, null> = 'full') => {
    setModes((current) => ({
      pomodoro:
        tool === 'pomodoro'
          ? mode
          : current.pomodoro === 'full'
            ? 'minimized'
            : current.pomodoro,
      'english-notes':
        tool === 'english-notes'
          ? mode
          : current['english-notes'] === 'full'
            ? 'minimized'
            : current['english-notes'],
    }))
  }, [])

  const minimizeTool = useCallback((tool: WorkspaceToolId) => {
    setModes((current) => ({ ...current, [tool]: 'minimized' }))
  }, [])

  const expandTool = useCallback((tool: WorkspaceToolId) => {
    setModes((current) => ({
      pomodoro:
        tool === 'pomodoro'
          ? 'full'
          : current.pomodoro === 'full'
            ? 'minimized'
            : current.pomodoro,
      'english-notes':
        tool === 'english-notes'
          ? 'full'
          : current['english-notes'] === 'full'
            ? 'minimized'
            : current['english-notes'],
    }))
  }, [])

  const value = useMemo(
    () => ({ modes, openTool, minimizeTool, expandTool }),
    [modes, openTool, minimizeTool, expandTool],
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
