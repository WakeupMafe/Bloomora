import { Button } from '@/components/ui/Button'

/** Acción reusable para insertar una caja de nota dentro de la hoja editable. */
export function NoteBlock({ onInsert }: { onInsert: () => void }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onPointerDown={(event) => event.preventDefault()}
      onClick={onInsert}
      aria-label="Insertar una nota destacada"
      title="Insertar nota destacada"
      className="!min-h-9 !px-2.5 text-xs"
    >
      <span aria-hidden className="mr-1 border-l-2 border-bloomora-rose px-1 text-bloomora-violet">▤</span>
      Nota
    </Button>
  )
}
