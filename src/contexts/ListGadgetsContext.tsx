import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ListGadgetsValue = {
  openListIds: string[]
  openListGadget: (listId: string) => void
  closeListGadget: (listId: string) => void
  isListGadgetOpen: (listId: string) => boolean
}

const ListGadgetsContext = createContext<ListGadgetsValue | null>(null)

export function ListGadgetsProvider({ children }: { children: ReactNode }) {
  const [openListIds, setOpenListIds] = useState<string[]>([])

  const openListGadget = useCallback((listId: string) => {
    setOpenListIds((current) =>
      current.includes(listId) ? current : [...current, listId],
    )
  }, [])

  const closeListGadget = useCallback((listId: string) => {
    setOpenListIds((current) => current.filter((id) => id !== listId))
  }, [])

  const isListGadgetOpen = useCallback(
    (listId: string) => openListIds.includes(listId),
    [openListIds],
  )

  const value = useMemo(
    () => ({
      openListIds,
      openListGadget,
      closeListGadget,
      isListGadgetOpen,
    }),
    [openListIds, openListGadget, closeListGadget, isListGadgetOpen],
  )

  return (
    <ListGadgetsContext.Provider value={value}>
      {children}
    </ListGadgetsContext.Provider>
  )
}

export function useListGadgets() {
  const context = useContext(ListGadgetsContext)
  if (!context) {
    throw new Error('useListGadgets debe usarse dentro de ListGadgetsProvider')
  }
  return context
}
