import { useEffect, useMemo, useState } from 'react'
import { BloomoraConfirmDialog } from '@/components/ui/BloomoraConfirmDialog'
import { EnglishFlashcardToolbar } from '@/features/flashcards/EnglishFlashcardToolbar'
import { FlashcardCategoryPack } from '@/features/flashcards/FlashcardCategoryPack'
import { buildCategoryPacks } from '@/features/flashcards/groupFlashcardsByCategory'
import { englishSearchText } from '@/features/flashcards/verbFormsCodec'
import type { EnglishFlashcard } from '@/types/englishFlashcard'

type EnglishFlashcardListProps = {
  cards: EnglishFlashcard[]
  search: string
  categoryFilter: string
  onSearchChange: (v: string) => void
  onCategoryFilterChange: (v: string) => void
  onEdit: (card: EnglishFlashcard) => void
  deleteTarget: EnglishFlashcard | null
  deletePending: boolean
  onRequestDelete: (card: EnglishFlashcard) => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

export function EnglishFlashcardList({
  cards,
  search,
  categoryFilter,
  onSearchChange,
  onCategoryFilterChange,
  onEdit,
  deleteTarget,
  deletePending,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: EnglishFlashcardListProps) {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set())
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(() => new Set())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cards.filter((c) => {
      if (categoryFilter && (c.category ?? '') !== categoryFilter) return false
      if (!q) return true
      const en = englishSearchText(c.englishWord, c.category).toLowerCase()
      return en.includes(q) || c.spanishMeaning.toLowerCase().includes(q)
    })
  }, [cards, search, categoryFilter])

  const packs = useMemo(() => buildCategoryPacks(filtered), [filtered])

  useEffect(() => {
    if (categoryFilter) {
      setExpandedPacks((prev) => {
        const next = new Set(prev)
        next.add(categoryFilter)
        return next
      })
      return
    }
    if (packs.length === 1) {
      setExpandedPacks(new Set([packs[0]!.key]))
    }
  }, [categoryFilter, packs])

  const togglePack = (key: string) => {
    setExpandedPacks((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <EnglishFlashcardToolbar
        search={search}
        categoryFilter={categoryFilter}
        onSearchChange={onSearchChange}
        onCategoryFilterChange={onCategoryFilterChange}
      />

      {packs.length === 0 ? (
        <div className="mt-10 rounded-[1.35rem] bg-white/80 px-6 py-12 text-center shadow-[0_4px_24px_-4px_rgba(91,74,140,0.08)] ring-1 ring-bloomora-line/15">
          <p className="text-base font-bold text-bloomora-deep">
            {cards.length === 0
              ? 'Aún no tienes flashcards'
              : 'Ninguna coincide con tu búsqueda'}
          </p>
          <p className="mt-2 text-sm text-bloomora-text-muted">
            {cards.length === 0
              ? 'Pulsa «Nueva palabra» para crear la primera con imagen.'
              : 'Prueba otro término o cambia el filtro de categoría.'}
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-5 p-0">
          {packs.map((pack) => (
            <FlashcardCategoryPack
              key={pack.key}
              pack={pack}
              expanded={expandedPacks.has(pack.key)}
              onToggle={() => togglePack(pack.key)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onEdit={onEdit}
              onDelete={onRequestDelete}
            />
          ))}
        </ul>
      )}

      <BloomoraConfirmDialog
        open={!!deleteTarget}
        title="¿Eliminar esta flashcard?"
        description={
          deleteTarget
            ? `Se borrará «${deleteTarget.englishWord.split('|')[0]}» de tu vocabulario.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        isPending={deletePending}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  )
}
