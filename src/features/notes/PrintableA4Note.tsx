import { notePageSheetClass } from '@/features/notes/noteEditorUtils'
import type { EnglishNotePageSize } from '@/types/englishNote'
import { cn } from '@/utils/cn'

type PrintableA4NoteProps = {
  title: string
  titleClassName?: string
  html: string
  pageSize?: EnglishNotePageSize
}

export function PrintableA4Note({
  title,
  titleClassName,
  html,
  pageSize = 'letter',
}: PrintableA4NoteProps) {
  return (
    <article
      className={cn(
        notePageSheetClass(pageSize),
        'rounded-[22px] bg-white shadow-[0_20px_54px_-24px_rgba(91,74,140,0.35)] ring-1 ring-bloomora-line/30',
      )}
    >
      <h2 className={cn('text-center text-3xl font-bold text-bloomora-deep', titleClassName)}>
        {title || 'Sin titulo'}
      </h2>
      <div
        className="english-note-content mt-5 text-[15px] text-[#1f1f1f]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}
