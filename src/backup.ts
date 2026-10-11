import type { EditNote, Preference } from './types';

export const PRIVATE_PREFERENCE_KEYS = new Set(['kakaoRestKey']);

export function preferencesForBackup(preferences: Preference[]): Preference[] {
  return preferences.filter((item) => !PRIVATE_PREFERENCE_KEYS.has(item.key));
}

export function preferencesForImport(current: Preference[], imported: Preference[]): Preference[] {
  const safeImported = preferencesForBackup(imported);
  const preserved = current.filter((item) => PRIVATE_PREFERENCE_KEYS.has(item.key));
  return [...safeImported, ...preserved];
}

export function editNotesFromBackup(payload: Record<string, unknown>): EditNote[] {
  return Array.isArray(payload.editNotes) ? payload.editNotes as EditNote[] : [];
}

export function epubFilesFromBackup(payload: Record<string, unknown>): Array<{ id: string; name: string; addedAt: number; lastCfi?: string; progress?: number; type: string; data: string }> {
  return Array.isArray(payload.epubFiles)
    ? payload.epubFiles as Array<{ id: string; name: string; addedAt: number; lastCfi?: string; progress?: number; type: string; data: string }>
    : [];
}
