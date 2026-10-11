export interface KakaoDocument {
  title: string;
  authors?: string[];
  translators?: string[];
  publisher?: string;
  isbn?: string;
  datetime?: string;
  thumbnail?: string;
}

export interface KakaoBookResult {
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  publishedYear?: number;
  coverUrl?: string;
}

export type KakaoSearchErrorCode = 'missing-key' | 'unauthorized' | 'quota' | 'offline' | 'other';

export class KakaoSearchError extends Error {
  constructor(public code: KakaoSearchErrorCode, message: string) { super(message); }
}

export function mapKakaoDocument(document: KakaoDocument): KakaoBookResult {
  const authors = document.authors?.filter(Boolean) ?? [];
  const translators = document.translators?.filter(Boolean) ?? [];
  const baseAuthor = authors.join(', ');
  const author = translators.length
    ? `${baseAuthor}${baseAuthor ? ' ' : ''}(옮김: ${translators.join(', ')})`
    : baseAuthor;
  const isbns = (document.isbn ?? '').trim().split(/\s+/).filter(Boolean);
  const isbn13 = isbns.find((value) => value.length === 13);
  const year = document.datetime ? Number(document.datetime.slice(0, 4)) : undefined;
  return {
    title: document.title,
    author: author || undefined,
    publisher: document.publisher || undefined,
    isbn: isbn13 ?? isbns[0],
    publishedYear: Number.isFinite(year) ? year : undefined,
    coverUrl: document.thumbnail || undefined
  };
}

export async function searchKakaoBooks(query: string, key: string, size = 10, fetcher: typeof fetch = fetch): Promise<KakaoBookResult[]> {
  if (!key.trim()) throw new KakaoSearchError('missing-key', '카카오 REST API 키가 필요합니다.');
  let response: Response;
  try {
    const url = new URL('https://dapi.kakao.com/v3/search/book');
    url.searchParams.set('query', query);
    url.searchParams.set('size', String(size));
    response = await fetcher(url, { headers: { Authorization: `KakaoAK ${key.trim()}` } });
  } catch {
    throw new KakaoSearchError('offline', '인터넷 연결이 없습니다.');
  }
  if (response.status === 401) throw new KakaoSearchError('unauthorized', '카카오 REST API 키가 올바르지 않습니다.');
  if (response.status === 429) throw new KakaoSearchError('quota', '카카오 검색 사용량을 초과했습니다.');
  if (!response.ok) throw new KakaoSearchError('other', `카카오 검색 중 오류가 발생했습니다. (${response.status})`);
  const payload = await response.json() as { documents?: KakaoDocument[] };
  return (payload.documents ?? []).map(mapKakaoDocument);
}

export function kakaoErrorMessage(error: unknown): string {
  if (error instanceof KakaoSearchError) return error.message;
  return '카카오 검색 중 알 수 없는 오류가 발생했습니다.';
}
