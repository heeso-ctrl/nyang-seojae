import Dexie, { type EntityTable } from 'dexie';
import type {
  ActiveTimer, Book, CoinLog, EditNote, EpubFile, Equipped,
  OwnedItem, Preference, Quote, Session, StoredBlob, Wallet
} from './types';
import { editNotesFromBackup, epubFilesFromBackup, preferencesForBackup, preferencesForImport } from './backup';

export class NyangDatabase extends Dexie {
  books!: EntityTable<Book, 'id'>;
  epubFiles!: EntityTable<EpubFile, 'id'>;
  blobs!: EntityTable<StoredBlob, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  quotes!: EntityTable<Quote, 'id'>;
  editNotes!: EntityTable<EditNote, 'id'>;
  wallets!: EntityTable<Wallet, 'id'>;
  ownedItems!: EntityTable<OwnedItem, 'itemId'>;
  equipped!: EntityTable<Equipped, 'id'>;
  coinLogs!: EntityTable<CoinLog, 'id'>;
  activeTimers!: EntityTable<ActiveTimer, 'id'>;
  preferences!: EntityTable<Preference, 'key'>;

  constructor() {
    super('nyang-seojae');
    this.version(1).stores({
      books: 'id, status, updatedAt, createdAt, finishedAt, title',
      epubFiles: 'id, addedAt',
      blobs: 'id, kind',
      sessions: 'id, bookId, startedAt, endedAt',
      quotes: 'id, bookId, createdAt',
      editNotes: 'id, bookId, status, createdAt',
      wallets: 'id',
      ownedItems: 'itemId, acquiredAt',
      equipped: 'id',
      coinLogs: 'id, at',
      activeTimers: 'id, bookId',
      preferences: 'key'
    });
  }
}

export const db = new NyangDatabase();

export async function exportBackup(includeEpubFiles = false): Promise<Blob> {
  const [books, sessions, quotes, editNotes, preferences, activeTimers, blobs, epubFiles] = await Promise.all([
    db.books.toArray(), db.sessions.toArray(), db.quotes.toArray(),
    db.editNotes.toArray(), db.preferences.toArray(), db.activeTimers.toArray(), db.blobs.toArray(),
    includeEpubFiles ? db.epubFiles.toArray() : Promise.resolve([])
  ]);
  const encodedBlobs = await Promise.all(blobs.map(async (item) => ({
    id: item.id,
    kind: item.kind,
    type: item.blob.type,
    data: await blobToDataUrl(item.blob)
  })));
  const encodedEpubFiles = await Promise.all(epubFiles.map(async (item) => ({
    id: item.id, name: item.name, addedAt: item.addedAt, lastCfi: item.lastCfi,
    progress: item.progress, type: item.blob.type, data: await blobToDataUrl(item.blob)
  })));
  return new Blob([JSON.stringify({ version: 1, exportedAt: Date.now(), books, sessions, quotes, editNotes, preferences: preferencesForBackup(preferences), activeTimers, blobs: encodedBlobs, ...(includeEpubFiles ? { epubFiles: encodedEpubFiles } : {}) }, null, 2)], { type: 'application/json' });
}

export async function importBackup(file: File): Promise<void> {
  const payload = JSON.parse(await file.text()) as Record<string, unknown>;
  if (payload.version !== 1 || !Array.isArray(payload.books)) throw new Error('지원하지 않는 백업 파일입니다.');
  const encoded = Array.isArray(payload.blobs) ? payload.blobs as Array<{id: string; kind: StoredBlob['kind']; data: string}> : [];
  const blobs = await Promise.all(encoded.map(async (item) => ({ id: item.id, kind: item.kind, blob: await (await fetch(item.data)).blob() })));
  const editNotes = editNotesFromBackup(payload);
  const encodedEpubFiles = epubFilesFromBackup(payload);
  const epubFiles = await Promise.all(encodedEpubFiles.map(async (item) => ({
    id: item.id, name: item.name, addedAt: item.addedAt, lastCfi: item.lastCfi,
    progress: item.progress, blob: await (await fetch(item.data)).blob()
  })));
  const currentPreferences = await db.preferences.toArray();
  const importedPreferences = Array.isArray(payload.preferences) ? payload.preferences as Preference[] : [];
  const nextPreferences = preferencesForImport(currentPreferences, importedPreferences);
  await db.transaction('rw', [db.books, db.sessions, db.quotes, db.editNotes, db.preferences, db.activeTimers, db.blobs, db.epubFiles], async () => {
    await Promise.all([db.books.clear(), db.sessions.clear(), db.quotes.clear(), db.editNotes.clear(), db.preferences.clear(), db.activeTimers.clear(), db.blobs.clear(), db.epubFiles.clear()]);
    await db.books.bulkPut(payload.books as Book[]);
    if (Array.isArray(payload.sessions)) await db.sessions.bulkPut(payload.sessions as Session[]);
    if (Array.isArray(payload.quotes)) await db.quotes.bulkPut(payload.quotes as Quote[]);
    await db.editNotes.bulkPut(editNotes);
    await db.preferences.bulkPut(nextPreferences);
    if (Array.isArray(payload.activeTimers)) await db.activeTimers.bulkPut(payload.activeTimers as ActiveTimer[]);
    await db.blobs.bulkPut(blobs);
    await db.epubFiles.bulkPut(epubFiles);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
