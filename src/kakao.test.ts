import { describe, expect, it, vi } from 'vitest';
import { KakaoSearchError, mapKakaoDocument, searchKakaoBooks } from './kakao';

describe('mapKakaoDocument', () => {
  it('저자와 역자, ISBN13, 출판 연도를 변환한다', () => {
    expect(mapKakaoDocument({ title: '책', authors: ['작가'], translators: ['번역가'], publisher: '출판사', isbn: '1234567890 9781234567890', datetime: '2020-04-01T00:00:00.000+09:00', thumbnail: 'https://search1.kakaocdn.net/a.jpg' })).toEqual({
      title: '책', author: '작가 (옮김: 번역가)', publisher: '출판사', isbn: '9781234567890', publishedYear: 2020, coverUrl: 'https://search1.kakaocdn.net/a.jpg'
    });
  });
  it('역자가 없고 ISBN이 하나인 응답을 처리한다', () => {
    expect(mapKakaoDocument({ title: '책', authors: ['작가'], isbn: '1234567890' })).toMatchObject({ author: '작가', isbn: '1234567890' });
  });
  it('빈 thumbnail은 coverUrl을 만들지 않는다', () => {
    expect(mapKakaoDocument({ title: '책', thumbnail: '' }).coverUrl).toBeUndefined();
  });
});

describe('searchKakaoBooks', () => {
  it('버튼 호출용 fetch에 인증 헤더와 size를 넣고 결과를 매핑한다', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ documents: [{ title: '어린 왕자', authors: ['생텍쥐페리'] }] }), { status: 200 })) as typeof fetch;
    const result = await searchKakaoBooks('어린 왕자', 'test-key', 10, fetcher);
    expect(result[0].title).toBe('어린 왕자');
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, options] = vi.mocked(fetcher).mock.calls[0];
    expect(String(url)).toContain('size=10');
    expect((options?.headers as Record<string, string>).Authorization).toBe('KakaoAK test-key');
  });
  it.each([[401, 'unauthorized'], [429, 'quota'], [500, 'other']] as const)('%s 응답을 구분한다', async (status, code) => {
    const fetcher = vi.fn(async () => new Response('{}', { status })) as typeof fetch;
    await expect(searchKakaoBooks('책', 'key', 10, fetcher)).rejects.toMatchObject({ code } satisfies Partial<KakaoSearchError>);
  });
  it('네트워크 오류를 offline으로 구분한다', async () => {
    const fetcher = vi.fn(async () => { throw new TypeError('network'); }) as typeof fetch;
    await expect(searchKakaoBooks('책', 'key', 10, fetcher)).rejects.toMatchObject({ code: 'offline' } satisfies Partial<KakaoSearchError>);
  });
});
