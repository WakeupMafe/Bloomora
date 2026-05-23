import { FLASHCARD_CATEGORY_OPTIONS } from '@/features/flashcards/flashcardCategories'
import {
  ChevronDownIcon,
  FilterIcon,
  SearchIcon,
} from '@/features/flashcards/FlashcardIcons'
import { cn } from '@/utils/cn'

type EnglishFlashcardToolbarProps = {
  search: string
  categoryFilter: string
  onSearchChange: (v: string) => void
  onCategoryFilterChange: (v: string) => void
}

export function EnglishFlashcardToolbar({
  search,
  categoryFilter,
  onSearchChange,
  onCategoryFilterChange,
}: EnglishFlashcardToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-bloomora-text-muted/70" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por palabra o significado..."
          aria-label="Buscar flashcards"
          className={cn(
            'bloomora-form-input h-12 w-full rounded-full border-0 bg-white pl-12 pr-4 text-sm font-medium text-bloomora-deep shadow-[0_2px_16px_-4px_rgba(91,74,140,0.1)] ring-1 ring-bloomora-line/20 outline-none',
            'placeholder:text-bloomora-text-muted/60 focus:ring-2 focus:ring-[#ddd6fe]/80',
          )}
        />
      </div>

      <div className="relative w-full shrink-0 lg:w-[15.5rem]">
        <FilterIcon className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-bloomora-text-muted/70" />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          aria-label="Filtrar por categoría"
          className={cn(
            'bloomora-form-input h-12 w-full cursor-pointer appearance-none rounded-full border-0 bg-white pl-12 pr-10 text-sm font-semibold text-bloomora-deep shadow-[0_2px_16px_-4px_rgba(91,74,140,0.1)] ring-1 ring-bloomora-line/20 outline-none',
            'focus:ring-2 focus:ring-[#ddd6fe]/80',
          )}
        >
          <option value="">Todas las categorías</option>
          {FLASHCARD_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-bloomora-text-muted" />
      </div>
    </div>
  )
}
