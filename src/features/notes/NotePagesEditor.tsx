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
  cleanLeadingEmptyNoteBlocks,
  extractOverflowHtml,
  isPageContentOverflowing,
  newNotePageId,
  type NotePageSlice,
} from '@/features/notes/notePageLayoutUtils'
import {
  attachNoteImageDragHandlers,
  enhanceNoteImages,
  notePageSheetClass,
  sanitizePastedNoteHtml,
} from '@/features/notes/noteEditorUtils'
import type { EnglishNotePageSize } from '@/types/englishNote'
import { cn } from '@/utils/cn'

const EDITABLE_BLOCK_SELECTOR = 'p,div,h1,h2,h3,li,blockquote'

function editableBlocks(content: HTMLElement): HTMLElement[] {
  return [...content.querySelectorAll<HTMLElement>(EDITABLE_BLOCK_SELECTOR)]
    .filter((block) => !block.querySelector(EDITABLE_BLOCK_SELECTOR))
}

function closestEditableBlock(node: Node, content: HTMLElement): HTMLElement | null {
  let element = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement
  while (element && element !== content) {
    if (element.matches(EDITABLE_BLOCK_SELECTOR)) return element
    element = element.parentElement
  }
  return null
}

function isAtBlockBoundary(block: HTMLElement, range: Range, edge: 'start' | 'end'): boolean {
  const probe = document.createRange()
  probe.selectNodeContents(block)
  if (edge === 'start') probe.setEnd(range.startContainer, range.startOffset)
  else probe.setStart(range.startContainer, range.startOffset)
  return !probe.toString().replace(/[\u200b\u00a0]/g, '').trim()
}

function isEmptyEditableBlock(block: HTMLElement): boolean {
  return !block.textContent?.replace(/[\u200b\u00a0]/g, '').trim()
    && !block.querySelector('img,hr,canvas,video,audio,[data-note-block="true"]')
}

function setCaretInBlock(block: HTMLElement, edge: 'start' | 'end') {
  block.focus?.()
  const range = document.createRange()
  range.selectNodeContents(block)
  range.collapse(edge === 'start')
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

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

  const removePageBreak = useCallback((pageIndex: number) => {
    if (pageIndex <= 0 || pageIndex >= pages.length) return
    const previousContent = pageContentRefsRef.current[pageIndex - 1]
    const currentContent = pageContentRefsRef.current[pageIndex]
    const previousHtml = previousContent?.innerHTML ?? pages[pageIndex - 1]?.html ?? ''
    const currentHtml = currentContent?.innerHTML ?? pages[pageIndex]?.html ?? ''
    const previousDoc = new DOMParser().parseFromString(previousHtml, 'text/html')
    const previousIsEmpty = !previousDoc.body.textContent?.trim() && !previousDoc.body.querySelector('img, [data-note-block="true"]')
    const currentDoc = new DOMParser().parseFromString(currentHtml, 'text/html')
    const currentIsEmpty = !currentDoc.body.textContent?.trim() && !currentDoc.body.querySelector('img, [data-note-block="true"]')
    const mergedHtml = `${previousIsEmpty ? '' : previousHtml}${currentIsEmpty ? '' : currentHtml}` || '<p><br /></p>'
    const updated = pages.filter((_, index) => index !== pageIndex).map((page, index) =>
      index === pageIndex - 1
        ? { ...page, html: mergedHtml }
        : page,
    )
    onPagesChange(updated)
    pendingFocusPageRef.current = pageIndex - 1
    setFocusedPageIndex(pageIndex - 1)
    setTimeout(() => scheduleOverflowCheck(pageIndex - 1), 0)
  }, [onPagesChange, pageContentRefsRef, pages, scheduleOverflowCheck])

  const moveCaretAcrossPages = (event: KeyboardEvent<HTMLDivElement>, pageIndex: number): boolean => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return false
    const content = pageContentRefsRef.current[pageIndex]
    const selection = window.getSelection()
    if (!content || !selection || selection.rangeCount === 0 || !selection.isCollapsed) return false
    const caret = selection.getRangeAt(0)
    if (!content.contains(caret.startContainer)) return false

    const atStart = document.createRange()
    atStart.selectNodeContents(content)
    atStart.setEnd(caret.startContainer, caret.startOffset)
    const atEnd = document.createRange()
    atEnd.selectNodeContents(content)
    atEnd.setStart(caret.startContainer, caret.startOffset)
    const isAtStart = !atStart.toString().trim()
    const isAtEnd = !atEnd.toString().trim()
    const targetIndex = event.key === 'ArrowUp' && isAtStart
      ? pageIndex - 1
      : event.key === 'ArrowDown' && isAtEnd
        ? pageIndex + 1
        : -1
    const target = pageContentRefsRef.current[targetIndex]
    if (!target) return false

    event.preventDefault()
    target.focus({ preventScroll: true })
    const nextRange = document.createRange()
    nextRange.selectNodeContents(target)
    nextRange.collapse(event.key === 'ArrowDown')
    selection.removeAllRanges()
    selection.addRange(nextRange)
    setFocusedPageIndex(targetIndex)
    setActiveEditor(target)
    return true
  }

  const handleWordBoundaryDelete = (event: KeyboardEvent<HTMLDivElement>, pageIndex: number): boolean => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return false
    const content = pageContentRefsRef.current[pageIndex]
    const selection = window.getSelection()
    if (!content || !selection || selection.rangeCount === 0 || !selection.isCollapsed) return false
    const range = selection.getRangeAt(0)
    if (!content.contains(range.startContainer)) return false
    const currentBlock = closestEditableBlock(range.startContainer, content)
    if (!currentBlock) return false
    const edge = event.key === 'Backspace' ? 'start' : 'end'
    if (!isAtBlockBoundary(currentBlock, range, edge)) return false

    const localBlocks = editableBlocks(content)
    let blockIndex = localBlocks.indexOf(currentBlock)
    if (blockIndex < 0) {
      localBlocks.push(currentBlock)
      localBlocks.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
      blockIndex = localBlocks.indexOf(currentBlock)
    }
    let neighbor: HTMLElement | null = localBlocks[blockIndex + (edge === 'start' ? -1 : 1)] ?? null
    let neighborPageIndex = pageIndex
    if (!neighbor) {
      neighborPageIndex = pageIndex + (edge === 'start' ? -1 : 1)
      const adjacentContent = pageContentRefsRef.current[neighborPageIndex]
      const adjacentBlocks = adjacentContent ? editableBlocks(adjacentContent) : []
      neighbor = edge === 'start' ? adjacentBlocks.at(-1) ?? null : adjacentBlocks[0] ?? null
    }
    if (!neighbor) return false

    event.preventDefault()
    const targetBlock = edge === 'start' ? neighbor : currentBlock
    const sourceBlock = edge === 'start' ? currentBlock : neighbor
    if (isEmptyEditableBlock(neighbor)) {
      neighbor.remove()
      setCaretInBlock(currentBlock, edge)
    } else {
      const marker = document.createTextNode('\u200b')
      targetBlock.appendChild(marker)
      while (sourceBlock.firstChild) targetBlock.appendChild(sourceBlock.firstChild)
      sourceBlock.remove()
      const caret = document.createRange()
      caret.setStartBefore(marker)
      caret.collapse(true)
      marker.remove()
      selection.removeAllRanges()
      selection.addRange(caret)
      const targetPageIndex = edge === 'start' ? neighborPageIndex : pageIndex
      if (targetPageIndex !== pageIndex) {
        setFocusedPageIndex(targetPageIndex)
        const targetContent = pageContentRefsRef.current[targetPageIndex]
        if (targetContent) setActiveEditor(targetContent)
      }
    }

    onPageInput()
    if (neighborPageIndex !== pageIndex) scheduleOverflowCheck(neighborPageIndex)
    scheduleOverflowCheck(pageIndex)
    return true
  }

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
                <div className="english-note-page-gutter">
                  <span className="english-note-page-gutter__label" aria-hidden>Salto de hoja</span>
                  <button
                    type="button"
                    className="english-note-page-gutter__remove"
                    aria-label={`Quitar salto antes de la hoja ${pageIndex + 1}`}
                    title="Quitar salto y unir con la hoja anterior"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => removePageBreak(pageIndex)}
                  >
                    Quitar salto
                  </button>
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
                    data-note-page
                    ref={(el) => {
                      if (el) hydratePage(pageIndex, el, page)
                      else pageContentRefsRef.current[pageIndex] = null
                    }}
                    contentEditable
                    suppressContentEditableWarning
                    onMouseDown={(event) => {
                      if (event.button !== 0) return
                      const content = event.currentTarget
                      const firstFlowNode = [...content.children].find(
                        (child) => window.getComputedStyle(child).position !== 'absolute',
                      )
                      if (!firstFlowNode || event.clientY >= firstFlowNode.getBoundingClientRect().top) return
                      event.preventDefault()
                      content.focus({ preventScroll: true })
                      const range = document.createRange()
                      range.selectNodeContents(content)
                      range.collapse(true)
                      const selection = window.getSelection()
                      selection?.removeAllRanges()
                      selection?.addRange(range)
                      setFocusedPageIndex(pageIndex)
                      setActiveEditor(content)
                    }}
                    onInput={() => {
                      onPageInput()
                      scheduleOverflowCheck(pageIndex)
                    }}
                    onFocus={(e) => {
                      setFocusedPageIndex(pageIndex)
                      setActiveEditor(e.currentTarget)
                    }}
                    onKeyDown={(event) => {
                      if (moveCaretAcrossPages(event, pageIndex)) return
                      if (handleWordBoundaryDelete(event, pageIndex)) return
                      onKeyDown(event)
                    }}
                    onPaste={(event) => {
                      const html = event.clipboardData.getData('text/html')
                      const plainText = event.clipboardData.getData('text/plain')
                      if (!html && !plainText) return
                      event.preventDefault()
                      const pastedHtml = html
                        ? sanitizePastedNoteHtml(html)
                        : plainText
                            .split(/\r?\n+/)
                            .map((paragraph) => `<p>${paragraph.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char).replace(/\n/g, '<br>')}</p>`)
                            .join('')
                      document.execCommand('insertHTML', false, cleanLeadingEmptyNoteBlocks(pastedHtml))
                      onPageInput()
                      scheduleOverflowCheck(pageIndex)
                    }}
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
                        ? 'Escribe aquí tu apunte; usa la barra para crear títulos y listas…'
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
