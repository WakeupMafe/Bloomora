import type { EnglishNote, EnglishNoteInput } from '@/types/englishNote'

const STORAGE_PREFIX = 'bloomora:english-notes:'

function normalizeNote(raw: EnglishNote): EnglishNote {
  return {
    ...raw,
    titleColor: raw.titleColor ?? 'black',
    pageSize: raw.pageSize ?? 'letter',
    pageNumberEnabled: raw.pageNumberEnabled ?? false,
    twoColumns: raw.twoColumns ?? false,
  }
}

export function storageKeyForEnglishNotes(userCedula: string): string {
  return `${STORAGE_PREFIX}${userCedula}`
}

function storageKey(userCedula: string): string {
  return storageKeyForEnglishNotes(userCedula)
}

function nowIso(): string {
  return new Date().toISOString()
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function listEnglishNotesLocal(userCedula: string): EnglishNote[] {
  try {
    const raw = localStorage.getItem(storageKey(userCedula))
    if (!raw) return []
    const parsed = JSON.parse(raw) as EnglishNote[]
    return parsed
      .filter((n) => !!n?.id)
      .map(normalizeNote)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  } catch {
    return []
  }
}

function saveAll(userCedula: string, notes: EnglishNote[]): boolean {
  try {
    localStorage.setItem(storageKey(userCedula), JSON.stringify(notes))
    return true
  } catch {
    return false
  }
}

export function createEnglishNoteLocal(
  userCedula: string,
  input?: Partial<EnglishNoteInput>,
): EnglishNote {
  const ts = nowIso()
  const created: EnglishNote = {
    id: newId(),
    userCedula,
    title: input?.title ?? '',
    category: input?.category?.trim() || null,
    titleFont: input?.titleFont ?? 'popis',
    titleColor: input?.titleColor ?? 'black',
    pageSize: input?.pageSize ?? 'letter',
    pageNumberEnabled: input?.pageNumberEnabled ?? false,
    twoColumns: input?.twoColumns ?? false,
    contentHtml: input?.contentHtml ?? '<p><br /></p>',
    plainText: input?.plainText ?? '',
    coverImageUrl: input?.coverImageUrl ?? null,
    createdAt: ts,
    updatedAt: ts,
  }
  const curr = listEnglishNotesLocal(userCedula)
  if (!saveAll(userCedula, [created, ...curr])) {
    throw new Error('english-notes-storage-full')
  }
  return created
}

export function updateEnglishNoteLocal(
  userCedula: string,
  noteId: string,
  patch: Partial<EnglishNoteInput>,
): EnglishNote | null {
  const curr = listEnglishNotesLocal(userCedula)
  const idx = curr.findIndex((n) => n.id === noteId)
  if (idx < 0) return null
  const prev = curr[idx]!
  const next: EnglishNote = {
    ...prev,
    ...patch,
    title: patch.title !== undefined ? patch.title : prev.title,
    category:
      patch.category !== undefined
        ? patch.category?.trim() || null
        : prev.category,
    titleColor: patch.titleColor ?? prev.titleColor,
    updatedAt: nowIso(),
  }
  curr[idx] = next
  if (!saveAll(userCedula, curr)) return null
  return next
}

export function deleteEnglishNoteLocal(
  userCedula: string,
  noteId: string,
): void {
  const curr = listEnglishNotesLocal(userCedula)
  saveAll(
    userCedula,
    curr.filter((n) => n.id !== noteId),
  )
}

