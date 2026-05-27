import type { EnglishNote, EnglishNoteInput } from '@/types/englishNote'

export const DRAFT_NOTE_PREFIX = 'draft-'

export function isDraftNoteId(id: string): boolean {
  return id.startsWith(DRAFT_NOTE_PREFIX)
}

export function createDraftEnglishNote(userCedula: string): EnglishNote {
  const ts = new Date().toISOString()
  return {
    id: `${DRAFT_NOTE_PREFIX}${crypto.randomUUID()}`,
    userCedula,
    title: '',
    category: null,
    titleFont: 'popis',
    titleColor: 'black',
    pageSize: 'letter',
    pageNumberEnabled: false,
    twoColumns: false,
    contentHtml: '<p><br /></p>',
    plainText: '',
    coverImageUrl: null,
    createdAt: ts,
    updatedAt: ts,
  }
}

export function mergeEnglishNotePatch(
  note: EnglishNote,
  patch: Partial<EnglishNoteInput>,
): EnglishNote {
  return {
    ...note,
    title: patch.title !== undefined ? patch.title : note.title,
    category: patch.category !== undefined ? patch.category : note.category,
    titleFont: patch.titleFont ?? note.titleFont,
    titleColor: patch.titleColor ?? note.titleColor,
    pageSize: patch.pageSize ?? note.pageSize,
    pageNumberEnabled: patch.pageNumberEnabled ?? note.pageNumberEnabled,
    twoColumns: patch.twoColumns ?? note.twoColumns,
    contentHtml: patch.contentHtml ?? note.contentHtml,
    plainText: patch.plainText ?? note.plainText,
    coverImageUrl:
      patch.coverImageUrl !== undefined ? patch.coverImageUrl : note.coverImageUrl,
    updatedAt: new Date().toISOString(),
  }
}

export function englishNoteToInput(note: EnglishNote): EnglishNoteInput {
  return {
    title: note.title,
    category: note.category,
    titleFont: note.titleFont,
    titleColor: note.titleColor,
    pageSize: note.pageSize,
    pageNumberEnabled: note.pageNumberEnabled,
    twoColumns: note.twoColumns,
    contentHtml: note.contentHtml,
    plainText: note.plainText,
    coverImageUrl: note.coverImageUrl,
  }
}
