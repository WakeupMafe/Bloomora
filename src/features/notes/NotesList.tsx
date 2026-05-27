import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { bloomoraPanelCardClass } from '@/components/ui/formControls'
import { noteDisplayTitle } from '@/features/notes/noteEditorUtils'
import type { EnglishNote } from '@/types/englishNote'
import { cn } from '@/utils/cn'

type NotesListProps = {
  notes: EnglishNote[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export function NotesList({
  notes,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: NotesListProps) {
  return (
    <Card variant="glass" className={cn(bloomoraPanelCardClass, 'p-4')}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-bloomora-violet">Apuntes</h2>
        <Button type="button" variant="primary" size="sm" onClick={onCreate}>
          + Nuevo
        </Button>
      </div>

      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              className={cn(
                '!min-h-auto flex-col items-start gap-0.5 rounded-2xl px-3 py-2 text-left',
                n.id === activeId &&
                  'border-bloomora-violet bg-bloomora-lavender-50 ring-2 ring-bloomora-lilac/30',
              )}
              onClick={() => onSelect(n.id)}
            >
              <span className="w-full truncate text-sm font-semibold">
                {noteDisplayTitle(n.title)}
              </span>
              <span className="text-xs font-normal opacity-80">
                {new Date(n.updatedAt).toLocaleDateString('es-CO')}
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 !min-h-8 px-2 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600"
              onClick={() => onDelete(n.id)}
            >
              Eliminar
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
