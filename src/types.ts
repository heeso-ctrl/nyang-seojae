export type BookSource = 'own-epub' | 'library-app' | 'paper' | 'audio' | 'other';
export type BookStatus = 'want' | 'reading' | 'done' | 'paused';

export interface Book {
  id: string;
  title: string;
  author?: string;
  source: BookSource;
  status: BookStatus;
  category?: string;
  fileId?: string;
  coverBlobId?: string;
  coverUrl?: string;
  publisher?: string;
  isbn?: string;
  publishedYear?: number;
  totalPages?: number;
  currentPage?: number;
  progress?: number;
  rating?: number;
  review?: string;
  isLifeBook?: boolean;
  startedAt?: number;
  finishedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface EpubFile {
  id: string;
  name: string;
  blob: Blob;
  addedAt: number;
  lastCfi?: string;
  progress?: number;
}

export interface StoredBlob {
  id: string;
  blob: Blob;
  kind: 'cover' | 'quote-image';
}

export interface Pause {
  at: number;
  until?: number;
  reason?: 'user' | 'idle' | 'outside-reader' | 'background';
}

export interface Session {
  id: string;
  bookId: string;
  startedAt: number;
  endedAt: number;
  activeSec: number;
  pauses: Pause[];
  mode: 'reader-auto' | 'timer' | 'manual';
  pageFrom?: number;
  pageTo?: number;
  progressFrom?: number;
  progressTo?: number;
  note?: string;
}

export interface Quote {
  id: string;
  bookId: string;
  text: string;
  page?: number;
  cfi?: string;
  origin: 'highlight' | 'typed' | 'ocr';
  sourceImageId?: string;
  memo?: string;
  createdAt: number;
}

export interface EditNote {
  id: string;
  bookId: string;
  cfi: string;
  selectedText: string;
  memo: string;
  status: 'todo' | 'done';
  createdAt: number;
}

export interface Wallet { id: 'me'; coins: number }
export interface OwnedItem { itemId: string; acquiredAt: number }
export interface Equipped { id: 'me'; theme: string; set: string; fur?: string; hat?: string; outfit?: string }
export interface CoinLog { id: string; amount: number; reason: string; at: number }
export interface ActiveTimer { id: 'current'; bookId: string; startedAt: number; pauses: Pause[]; mode?: 'timer' | 'reader-auto'; progressFrom?: number }
export interface Preference { key: string; value: unknown }

export interface ReaderKeys {
  next: string[];
  previous: string[];
  swapped: boolean;
}

export interface ReaderStyle {
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  indent?: number;
  margin: number;
  fontWeight: 400 | 500 | 600 | 700;
  fontFamily: 'book' | 'serif' | 'sans';
}

export type DisplayMode = 'eink' | 'phone';

export const sourceLabels: Record<BookSource, string> = {
  'own-epub': '내 글',
  'library-app': '도서관 전자책',
  paper: '종이책',
  audio: '오디오북',
  other: '기타'
};

export const statusLabels: Record<BookStatus, string> = {
  want: '읽을 책',
  reading: '읽고 있는 책',
  done: '읽은 책',
  paused: '멈춘 책'
};
