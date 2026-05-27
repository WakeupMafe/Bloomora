import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackButton } from '@/components/navigation/BackButton'
import { Card } from '@/components/ui/Card'
import { buttonClassName } from '@/components/ui/buttonRecipe'
import { bloomoraPanelCardClass } from '@/components/ui/formControls'
import { useBloomoraToast } from '@/contexts/BloomoraToastContext'
import { useUserPhone } from '@/contexts/UserPhoneContext'
import { NoteEditor } from '@/features/notes/NoteEditor'
import { NotesList } from '@/features/notes/NotesList'
import {
  createEnglishNoteLocal,
  deleteEnglishNoteLocal,
  listEnglishNotesLocal,
  updateEnglishNoteLocal,
} from '@/services/local/englishNotesLocalRepo'
import type { EnglishNote } from '@/types/englishNote'
import { cn } from '@/utils/cn'

export function EnglishNotesPage() {
  const { cedula } = useUserPhone()
  const { showToast } = useBloomoraToast()

  const [notes, setNotes] = useState<EnglishNote[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!cedula) {
      setNotes([])
      setActiveId(null)
      return
    }
    const loaded = listEnglishNotesLocal(cedula)
    setNotes(loaded)
    setActiveId((curr) => {
      if (curr && loaded.some((n) => n.id === curr)) return curr
      return loaded[0]?.id ?? null
    })
  }, [cedula])

  const active = useMemo(
    () => notes.find((n) => n.id === activeId) ?? null,
    [notes, activeId],
  )

  const refresh = (userCedula: string) => {
    const next = listEnglishNotesLocal(userCedula)
    setNotes(next)
    setActiveId((curr) => curr ?? next[0]?.id ?? null)
  }

  const createNote = () => {
    if (!cedula) return
    const created = createEnglishNoteLocal(cedula, {})
    refresh(cedula)
    setActiveId(created.id)
  }

  const deleteNote = (id: string) => {
    if (!cedula) return
    if (!window.confirm('Eliminar este apunte?')) return
    deleteEnglishNoteLocal(cedula, id)
    const next = listEnglishNotesLocal(cedula)
    setNotes(next)
    setActiveId(next[0]?.id ?? null)
  }

  const patchNote = (
    noteId: string,
    patch: Partial<{
      title: string
      category: string | null
      titleFont: 'popis' | 'arial' | 'cursive' | 'cursive2'
      titleColor: 'coral' | 'violet' | 'babyBlue' | 'gray' | 'black'
      pageSize: 'a4' | 'letter'
      pageNumberEnabled: boolean
      twoColumns: boolean
      contentHtml: string
      plainText: string
      coverImageUrl: string | null
    }>,
  ): boolean => {
    if (!cedula) return false
    const updated = updateEnglishNoteLocal(cedula, noteId, patch)
    if (!updated) {
      showToast('No se pudo guardar. Prueba con menos imagenes o pulsa Guardar de nuevo.')
      return false
    }
    setNotes(listEnglishNotesLocal(cedula))
    return true
  }

  return (
    <div className="english-notes-shell app-shell-padding mx-auto min-h-dvh bg-bloomora-snow pb-16">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BackButton to="/app" label="Volver al inicio" />
        <div className="flex items-center gap-2">
          <Link
            to="/app/study-tools"
            className={buttonClassName({ variant: 'ghost', size: 'sm' })}
          >
            Herramientas
          </Link>
          <Link
            to="/app"
            className={buttonClassName({ variant: 'ghost', size: 'sm' })}
          >
            Inicio
          </Link>
        </div>
      </div>

      <header className="mb-6">
        <h1 className="text-[clamp(1.4rem,1.1rem+1.2vw,2rem)] font-bold text-bloomora-deep">
          Apuntes de ingles
        </h1>
      </header>

      {!cedula ? (
        <Card variant="glass" className={cn(bloomoraPanelCardClass, 'text-sm text-bloomora-text-muted')}>
          Necesitas iniciar sesion para guardar apuntes.
        </Card>
      ) : (
        <div className="grid gap-5">
          <NotesList
            notes={notes}
            activeId={activeId}
            onSelect={setActiveId}
            onCreate={() => {
              createNote()
              showToast('Nuevo apunte creado')
            }}
            onDelete={(id) => {
              deleteNote(id)
              showToast('Apunte eliminado')
            }}
          />
          <NoteEditor note={active} onPatch={patchNote} />
        </div>
      )}
    </div>
  )
}

