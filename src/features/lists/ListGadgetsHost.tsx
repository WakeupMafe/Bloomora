import { useListGadgets } from '@/contexts/ListGadgetsContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { ListGadget } from '@/features/lists/ListGadget'
import { useBloomoraLists } from '@/hooks/useBloomoraLists'
import { useMediaQuery } from '@/hooks/useMediaQuery'

/** Post-its de listas: solo tablet/PC (≥768px). */
export function ListGadgetsHost() {
  const isTabletOrDesktop = useMediaQuery('(min-width: 768px)')
  const { openListIds, closeListGadget } = useListGadgets()
  const { cedula } = useUserPhone()
  const { data: lists = [] } = useBloomoraLists(cedula)

  if (!isTabletOrDesktop || openListIds.length === 0) return null

  const visible = openListIds
    .map((listId) => lists.find((l) => l.id === listId))
    .filter((list): list is NonNullable<typeof list> => Boolean(list))

  return (
    <>
      {visible.map((list, index) => (
        <ListGadget
          key={list.id}
          listId={list.id}
          title={list.title}
          stackIndex={index}
          postitPalette={list.postitPalette}
          onClose={() => closeListGadget(list.id)}
        />
      ))}
    </>
  )
}
