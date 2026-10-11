import type { Preference } from './types';

export const PRIVATE_PREFERENCE_KEYS = new Set(['kakaoRestKey']);

export function preferencesForBackup(preferences: Preference[]): Preference[] {
  return preferences.filter((item) => !PRIVATE_PREFERENCE_KEYS.has(item.key));
}

export function preferencesForImport(current: Preference[], imported: Preference[]): Preference[] {
  const safeImported = preferencesForBackup(imported);
  const preserved = current.filter((item) => PRIVATE_PREFERENCE_KEYS.has(item.key));
  return [...safeImported, ...preserved];
}
