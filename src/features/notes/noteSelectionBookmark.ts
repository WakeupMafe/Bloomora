export type EditorSelectionBookmark = {
  range: Range
}

export function captureEditorSelection(editor: HTMLElement): EditorSelectionBookmark | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return null
  return { range: range.cloneRange() }
}

export function restoreEditorSelection(
  editor: HTMLElement,
  bookmark: EditorSelectionBookmark | null,
): boolean {
  if (!bookmark) return false
  try {
    editor.focus({ preventScroll: true })
    const sel = window.getSelection()
    if (!sel) return false
    sel.removeAllRanges()
    sel.addRange(bookmark.range.cloneRange())
    return true
  } catch {
    return false
  }
}

export function coordsFromBookmark(
  editor: HTMLElement,
  bookmark: EditorSelectionBookmark,
): { top: number; left: number } | null {
  const restored = restoreEditorSelection(editor, bookmark)
  if (!restored) return null
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const rect = sel.getRangeAt(0).getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return {
    top: Math.max(8, rect.top - 10),
    left: rect.left + rect.width / 2,
  }
}
