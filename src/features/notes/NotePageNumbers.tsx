import { useCallback, useEffect, useState } from 'react'
import type { EnglishNotePageSize } from '@/types/englishNote'

const PAGE_HEIGHT: Record<EnglishNotePageSize, string> = {
  letter: '11in',
  a4: '297mm',
}

function lengthToPx(value: string, rootFontSize: number): number {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return 0
  if (value.endsWith('in')) return n * 96
  if (value.endsWith('mm')) return (n * 96) / 25.4
  if (value.endsWith('px')) return n
  if (value.endsWith('rem')) return n * rootFontSize
  return n
}

type NotePageNumbersProps = {
  enabled: boolean
  pageSize: EnglishNotePageSize
  sheetRef: React.RefObject<HTMLElement | null>
  contentRef: React.RefObject<HTMLElement | null>
}

export function NotePageNumbers({
  enabled,
  pageSize,
  sheetRef,
  contentRef,
}: NotePageNumbersProps) {
  const [layout, setLayout] = useState<{ pageHeightPx: number; pageCount: number }>({
    pageHeightPx: 0,
    pageCount: 1,
  })

  const measure = useCallback(() => {
    if (!enabled) return
    const sheet = sheetRef.current
    const content = contentRef.current
    if (!sheet || !content) return

    const rootFontSize =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const pageHeightPx = lengthToPx(PAGE_HEIGHT[pageSize], rootFontSize)

    const sheetStyles = getComputedStyle(sheet)
    const padTop = parseFloat(sheetStyles.paddingTop) || 0
    const padBottom = parseFloat(sheetStyles.paddingBottom) || 0
    const usableHeight = Math.max(120, pageHeightPx - padTop - padBottom)
    const pageCount = Math.max(1, Math.ceil(content.scrollHeight / usableHeight))

    setLayout({ pageHeightPx, pageCount })
  }, [enabled, pageSize, sheetRef, contentRef])

  useEffect(() => {
    if (!enabled) return
    measure()
    const content = contentRef.current
    if (!content) return

    const ro = new ResizeObserver(() => measure())
    ro.observe(content)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [enabled, measure, contentRef])

  if (!enabled || layout.pageHeightPx <= 0) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: layout.pageCount }, (_, i) => (
        <span
          key={i}
          className="english-note-page-number"
          style={{
            top: `${(i + 1) * layout.pageHeightPx - 28}px`,
          }}
        >
          {i + 1}
        </span>
      ))}
    </div>
  )
}
