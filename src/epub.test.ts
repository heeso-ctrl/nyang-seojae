import { describe, expect, it } from 'vitest';
import { readerCss } from './epub';
import { defaultReaderStyle } from './readerStyle';

describe('readerCss', () => {
  it('루트 글자 크기만 바꾸고 책의 제목·강조·작은 글자 크기와 굵기를 보존한다', () => {
    const css = readerCss({ ...defaultReaderStyle('eink'), fontSize: 30, fontWeight: 700 }, 'eink');
    expect(css).toContain('html { font-size: 30px !important; }');
    expect(css).toContain('font-size: 1rem !important');
    expect(css).not.toMatch(/(?:p|div|span)[^{}]*\{[^}]*font-size:/s);
    expect(css).not.toContain('font-weight:');
    expect(css).toContain('-webkit-text-stroke: 0.5px !important');
  });

  it('줄간격은 body와 제목 밖 문단 블록에만 적용하고 span에는 직접 적용하지 않는다', () => {
    const css = readerCss({ ...defaultReaderStyle('phone'), lineHeight: 2.4 }, 'phone');
    expect(css).toContain('body {');
    expect(css).toContain('line-height: 2.4 !important');
    expect(css).toContain(':not(h1 *, h2 *, h3 *, h4 *, h5 *, h6 *)');
    expect(css).not.toMatch(/span[^{}]*\{[^}]*line-height:/s);
  });

  it('문단의 위 여백을 없애고 아래 간격을 적용하되 감싸개 div는 제외한다', () => {
    const css = readerCss({ ...defaultReaderStyle('phone'), paragraphSpacing: 1.5 }, 'phone');
    expect(css).toContain('div:not(:has(div, p))');
    expect(css).toContain('margin-top: 0 !important');
    expect(css).toContain('margin-bottom: 1.5em !important');
    expect(css).not.toContain('div { margin-bottom:');
  });

  it('들여쓰기는 값이 있을 때만 제목 밖 문단 블록에 넣는다', () => {
    const base = defaultReaderStyle('phone');
    expect(readerCss(base, 'phone')).not.toContain('text-indent:');
    const css = readerCss({ ...base, indent: 1.2 }, 'phone');
    expect(css).toContain('text-indent: 1.2em !important');
    expect(css).toContain(':not(h1 *, h2 *, h3 *, h4 *, h5 *, h6 *)');
  });

  it('화면 모드별 본문색과 배경색을 적용한다', () => {
    expect(readerCss(defaultReaderStyle('eink'), 'eink')).toContain('color: #000000 !important; background: #ffffff !important');
    expect(readerCss(defaultReaderStyle('phone'), 'phone')).toContain('color: #221f1c !important; background: #fffdf6 !important');
  });
});
