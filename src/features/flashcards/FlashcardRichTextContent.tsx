import {
  isFlashcardRichHtml,
  prepareFlashcardRichHtml,
} from '@/features/flashcards/flashcardRichText'
import { cn } from '@/utils/cn'

type FlashcardRichTextContentProps = {
  html: string
  className?: string
}

export function FlashcardRichTextContent({
  html,
  className,
}: FlashcardRichTextContentProps) {
  if (!html.trim()) return null

  const prepared = prepareFlashcardRichHtml(html)
  const useRich = isFlashcardRichHtml(html) || prepared.includes('<ol')

  if (!useRich) {
    return (
      <p className={cn('whitespace-pre-wrap', className)}>{html}</p>
    )
  }

  return (
    <div
      className={cn('flashcard-rich-content', className)}
      dangerouslySetInnerHTML={{ __html: prepared }}
    />
  )
}
