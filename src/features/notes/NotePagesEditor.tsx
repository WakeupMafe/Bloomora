import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { useBloomoraAlert } from '@/contexts/BloomoraAlertContext'
import {
  extractOverflowHtml,
  isPageContentOverflowing,
  newNotePageId,
  type NotePageSlice,
} from '@/features/notes/notePageLayoutUtils'
import {
  attachNoteImageDragHandlers,
  enhanceNoteImages,
  notePageSheetClass,
} from '@/features/notes/noteEditorUtils'
import type { EnglishNotePageSize } from '@/types/englishNote'
import { cn } from '@/utils/cn'

type NotePagesEditorProps = {
  pages: NotePageSlice[]
  onPagesChange: (pages: NotePageSlice[]) => void
  pageSize: EnglishNotePageSize
  pageNumberEnabled: boolean
  twoColumns: boolean
  activeEditorRef: RefObject<HTMLDivElement | null>
  pageContentRefsRef: RefObject<Array<HTMLDivElement | null>>
  insertPageBreakRef?: RefObject<(() => void) | null>
  documentKey: string
  onPageInput: () => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
}

export function NotePagesEditor({
  pages,
  onPagesChange,
  pageSize,
  pageNumberEnabled,
  twoColumns,
  activeEditorRef,
  pageContentRefsRef,
  insertPageBreakRef,
  documentKey,
  onPageInput,
  onKeyDown,
}: NotePagesEditorProps) {
  const { confirm } = useBloomoraAlert()
  const sheetRefs = useRef<Array<HTMLElement | null>>([])
  const surfaceRefs = useRef<Array<HTMLDivElement | null>>([])
  const hydratedPageIdsRef = useRef<Set<string>>(new Set())
  const overflowPromptOpenRef = useRef(false)
  const [overflowDeclinedPages, setOverflowDeclinedPages] = useState<Set<number>>(
    () => new Set(),
  )
  const [overflowPages, setOverflowPages] = useState<Set<number>>(() => new Set())
  const [focusedPageIndex, setFocusedPageIndex] = useState(0)
  const pendingFocusPageRef = useRef<number | null>(null)
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setActiveEditor = useCallback(
    (el: HTMLDivElement | null) => {
      ;(activeEditorRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    },
    [activeEditorRef],
  )

  const refreshOverflowState = useCallback(() => {
    const nextOverflow = new Set<number>()
    pageContentRefsRef.current.forEach((el, index) => {
      if (el && isPageContentOverflowing(el, surfaceRefs.current[index])) {
        nextOverflow.add(index)
      }
    })
    setOverflowPages(nextOverflow)
  }, [pageContentRefsRef])

  useEffect(() => {
    hydratedPageIdsRef.current.clear()
    setOverflowDeclinedPages(new Set())
    setOverflowPages(new Set())
  }, [documentKey])

  useEffect(() => {
    pageContentRefsRef.current = pageContentRefsRef.current.slice(0, pages.length)
    sheetRefs.current = sheetRefs.current.slice(0, pages.length)
    surfaceRefs.current = surfaceRefs.current.slice(0, pages.length)
    refreshOverflowState()
  }, [pages.length, pageContentRefsRef, refreshOverflowState])

  useEffect(() => {
    const cleanups: Array<() => void> = []
    pageContentRefsRef.current.forEach((el) => {
      if (!el) return
      enhanceNoteImages(el)
      cleanups.push(attachNoteImageDragHandlers(el, onPageInput))
    })
    return () => cleanups.forEach((fn) => fn())
  }, [pages.length, onPageInput, pageContentRefsRef])

  useEffect(
    () => () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (pendingFocusPageRef.current == null) return
    const idx = pendingFocusPageRef.current
    const el = pageContentRefsRef.current[idx]
    if (el) {
      el.focus()
      setActiveEditor(el)
      setFocusedPageIndex(idx)
      pendingFocusPageRef.current = null
    }
  }, [pages, pageContentRefsRef, setActiveEditor])

  const performPageBreak = useCallback(
    (pageIndex: number) => {
      const contentEl = pageContentRefsRef.current[pageIndex]
      const surfaceEl = surfaceRefs.current[pageIndex]
      if (!contentEl) return false

      const clipHeight = surfaceEl?.clientHeight ?? contentEl.clientHeight
      const overflowHtml = extractOverflowHtml(contentEl, clipHeight)
      if (!overflowHtml) return false

      const keptHtml = contentEl.innerHTML
      const updated: NotePageSlice[] = pages.map((p, i) =>
        i === pageIndex ? { ...p, html: keptHtml } : p,
      )
      updated.splice(pageIndex + 1, 0, {
        id: newNotePageId(),
        html: overflowHtml,
      })
      onPagesChange(updated)
      setOverflowDeclinedPages((prev) => {
        const next = new Set(prev)
        next.delete(pageIndex)
        return next
      })
      pendingFocusPageRef.current = pageIndex + 1
      refreshOverflowState()
      return true
    },
    [onPagesChange, pageContentRefsRef, pages, refreshOverflowState],
  )

  const insertEmptyPageAfter = useCallback(
    (pageIndex: number) => {
      const updated = [...pages]
      updated.splice(pageIndex + 1, 0, {
        id: newNotePageId(),
        html: '<p><br /></p>',
      })
      onPagesChange(updated)
      pendingFocusPageRef.current = pageIndex + 1
    },
    [onPagesChange, pages],
  )

  const requestPageBreak = useCallback(
    async (pageIndex: number, skipConfirm = false) => {
      const contentEl = pageContentRefsRef.current[pageIndex]
      const surfaceEl = surfaceRefs.current[pageIndex]
      if (!contentEl) return

      if (!isPageContentOverflowing(contentEl, surfaceEl)) {
        insertEmptyPageAfter(pageIndex)
        return
      }

      if (!skipConfirm) {
        overflowPromptOpenRef.current = true
        const ok = await confirm({
          title: '¿Quieres hacer un salto de hoja?',
          description:
            'El texto ya no cabe en esta hoja. El contenido que sobra pasará a una pagina nueva, como en Word.',
          confirmLabel: 'Si, nueva hoja',
          cancelLabel: 'No, por ahora',
          tone: 'default',
        })
        overflowPromptOpenRef.current = false
        if (!ok) {
          setOverflowDeclinedPages((prev) => new Set(prev).add(pageIndex))
          return
        }
      }

      if (!performPageBreak(pageIndex)) {
        insertEmptyPageAfter(pageIndex)
      }
    },
    [confirm, insertEmptyPageAfter, pageContentRefsRef, performPageBreak],
  )

  useEffect(() => {
    if (insertPageBreakRef) {
      insertPageBreakRef.current = () => {
        void requestPageBreak(focusedPageIndex, true)
      }
    }
    return () => {
      if (insertPageBreakRef) insertPageBreakRef.current = null
    }
  }, [focusedPageIndex, insertPageBreakRef, requestPageBreak])

  const checkPageOverflow = useCallback(
    async (pageIndex: number) => {
      if (overflowPromptOpenRef.current) return
      if (overflowDeclinedPages.has(pageIndex)) return

      const contentEl = pageContentRefsRef.current[pageIndex]
      const surfaceEl = surfaceRefs.current[pageIndex]
      if (!contentEl) return

      refreshOverflowState()
      if (!isPageContentOverflowing(contentEl, surfaceEl)) {
        setOverflowDeclinedPages((prev) => {
          if (!prev.has(pageIndex)) return prev
          const next = new Set(prev)
          next.delete(pageIndex)
          return next
        })
        return
      }

      await requestPageBreak(pageIndex, false)
    },
    [
      overflowDeclinedPages,
      pageContentRefsRef,
      refreshOverflowState,
      requestPageBreak,
    ],
  )

  const scheduleOverflowCheck = useCallback(
    (pageIndex: number) => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
      checkTimerRef.current = setTimeout(() => {
        refreshOverflowState()
        void checkPageOverflow(pageIndex)
      }, 350)
    },
    [checkPageOverflow, refreshOverflowState],
  )

  const hydratePage = (pageIndex: number, el: HTMLDivElement, page: NotePageSlice) => {
    pageContentRefsRef.current[pageIndex] = el
    if (!hydratedPageIdsRef.current.has(page.id)) {
      el.innerHTML = page.html
      hydratedPageIdsRef.current.add(page.id)
      enhanceNoteImages(el)
    }
    if (pageIndex === 0 && !activeEditorRef.current) {
      setActiveEditor(el)
    }
  }

  const totalPages = pages.length

  return (
    <div className="english-note-pages-canvas">
      <div className="english-note-pages-stack">
        {pages.map((page, pageIndex) => {
          const showOverflowHint =
            overflowPages.has(pageIndex) && overflowDeclinedPages.has(pageIndex)

          return (
            <div key={page.id} className="english-note-page-block">
              {pageIndex > 0 ? (
                <div className="english-note-page-gutter" aria-hidden>
                  <span className="english-note-page-gutter__label">Salto de hoja</span>
                </div>
              ) : null}
              <article
                ref={(el) => {
                  sheetRefs.current[pageIndex] = el
                }}
                className={cn(
                  notePageSheetClass(pageSize),
                  'english-note-sheet--paged',
                )}
              >
                {pageNumberEnabled ? (
                  <span className="english-note-page-number english-note-page-number--fixed">
                    {pageIndex + 1} / {totalPages}
                  </span>
                ) : null}
                <div
                  ref={(el) => {
                    surfaceRefs.current[pageIndex] = el
                  }}
                  className={cn(
                    'english-note-page-surface',
                    showOverflowHint && 'english-note-page-surface--clipped',
                  )}
                >
                  <div
                    ref={(el) => {
                      if (el) hydratePage(pageIndex, el, page)
                      else pageContentRefsRef.current[pageIndex] = null
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                      onPageInput()
                      scheduleOverflowCheck(pageIndex)
                    }}
                    onFocus={(e) => {
                      setFocusedPageIndex(pageIndex)
                      setActiveEditor(e.currentTarget)
                    }}
                    onKeyDown={onKeyDown}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      onPageInput()
                    }}
                    className={cn(
                      'english-note-content english-note-content--paged',
                      twoColumns && 'english-note-content--two-columns',
                    )}
                    data-placeholder={
                      pageIndex === 0
                        ? 'Escribe aqui tu apunte, titulos, listas...'
                        : 'Continua en esta hoja...'
                    }
                  />
                </div>
                {showOverflowHint ? (
                  <div className="english-note-page-overflow-bar">
                    <p>Hay texto que no cabe en esta hoja.</p>
                    <button
                      type="button"
                      onClick={() => void requestPageBreak(pageIndex, true)}
                    >
                      Continuar en nueva hoja
                    </button>
                  </div>
                ) : null}
              </article>
            </div>
          )
        })}
      </div>
    </div>
  )
}
