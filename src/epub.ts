export interface FoliateBook {
  metadata?: { title?: unknown; author?: unknown };
  toc?: FoliateTocItem[];
  dir?: string;
  getCover?: () => Promise<Blob | null>;
  destroy?: () => void;
}

export interface FoliateTocItem {
  label?: string;
  href?: string;
  subitems?: FoliateTocItem[];
}

export interface FoliateRelocate {
  cfi?: string;
  fraction?: number;
  tocItem?: { label?: string; href?: string };
}

export interface FoliateViewElement extends HTMLElement {
  book: FoliateBook;
  renderer: HTMLElement & {
    setStyles?: (styles: string) => void;
    getContents?: () => Array<{ doc: Document; index: number }>;
  };
  lastLocation?: FoliateRelocate;
  open(file: File): Promise<void>;
  init(options: { lastLocation?: string; showTextStart?: boolean }): Promise<void>;
  close(): void;
  next(): Promise<void>;
  prev(): Promise<void>;
  goTo(target: string): Promise<unknown>;
  goToFraction(fraction: number): Promise<void>;
  getCFI(index: number, range: Range): string;
  addAnnotation(annotation: { value: string; kind?: string }): Promise<unknown>;
  select(target: string): Promise<void>;
  deselect(): void;
}

type LanguageMap = Record<string, string>;

function languageText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const first = Object.values(value as LanguageMap).find((item) => typeof item === 'string');
    return first ?? '';
  }
  return '';
}

function contributorText(value: unknown): string {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'name' in item) return languageText((item as { name: unknown }).name);
    return languageText(item);
  }).filter(Boolean).join(', ');
}

export async function ensureFoliate(): Promise<void> {
  await import('../vendor/foliate-js/view.js');
}

export async function readEpubMetadata(file: File): Promise<{ title: string; author?: string; cover?: Blob }> {
  const { makeBook } = await import('../vendor/foliate-js/view.js');
  const book = await makeBook(file) as FoliateBook;
  try {
    const title = languageText(book.metadata?.title).trim() || file.name.replace(/\.epub$/i, '');
    const author = contributorText(book.metadata?.author).trim() || undefined;
    const cover = await book.getCover?.() ?? undefined;
    return { title, author, cover: cover ?? undefined };
  } finally {
    book.destroy?.();
  }
}

export function readerCss(fontSize: number, lineHeight: number, fontFamily: 'book' | 'serif' | 'sans'): string {
  const family = fontFamily === 'serif' ? 'Georgia, Batang, serif'
    : fontFamily === 'sans' ? 'Arial, "Noto Sans CJK KR", sans-serif' : 'inherit';
  return `
    html { font-size: ${fontSize}%; color: #221f1c; background: #fffdf6; }
    body { font-family: ${family}; }
    p, li, blockquote, dd { line-height: ${lineHeight}; }
    script { display: none !important; }
  `;
}
