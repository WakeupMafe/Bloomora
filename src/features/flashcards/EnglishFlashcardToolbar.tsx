import { FLASHCARD_CATEGORY_OPTIONS } from "@/features/flashcards/flashcardCategories";
import {
  ChevronDownIcon,
  FilterIcon,
  SearchIcon,
} from "@/features/flashcards/FlashcardIcons";
import { cn } from "@/utils/cn";

type EnglishFlashcardToolbarProps = {
  search: string;
  categoryFilter: string;
  onSearchChange: (v: string) => void;
  onCategoryFilterChange: (v: string) => void;
};

const fieldClass =
  "bloomora-form-input h-12 min-h-12 w-full max-w-full rounded-full border-0 bg-white pl-12 pr-4 text-sm font-medium text-[#3E2C41] shadow-[0_4px_18px_-10px_rgba(62,44,65,0.12)] ring-1 ring-[#F0E4E8] outline-none placeholder:text-[#8A7A8C]/80 focus:ring-2 focus:ring-[#FBE3EA]";

export function EnglishFlashcardToolbar({
  search,
  categoryFilter,
  onSearchChange,
  onCategoryFilterChange,
}: EnglishFlashcardToolbarProps) {
  return (
    <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] items-center gap-2">
      <div className="relative min-w-0">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7A8C]" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por palabra o significado..."
          aria-label="Buscar flashcards"
          className={fieldClass}
        />
      </div>

      <div className="relative min-w-0">
        <FilterIcon className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#8A7A8C]" />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          aria-label="Filtrar por categoría"
          className={cn(
            fieldClass,
            "cursor-pointer appearance-none pr-10 font-semibold",
          )}
        >
          <option value="">Todas las categorías</option>
          {FLASHCARD_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8A7A8C]" />
      </div>
    </div>
  );
}
