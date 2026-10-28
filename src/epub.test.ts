import { describe, expect, it } from 'vitest';
import { readerCss } from './epub';
import { defaultReaderStyle } from './readerStyle';

describe('readerCss', () => {
  it('div 문단의 줄간격과 간격을 important로 덮고 감싸개 div는 문단 선택자에서 제외한다', () => {
    const css = readerCss({ ...defaultReaderStyle('phone'), lineHeight: 2.4, paragraphSpacing: 1.5 }, 'phone');
    expect(css).toContain('body, p, div, li, blockquote, dd, span');
    expect(css).toContain('line-height: 2.4 !important');
    expect(css).toContain('div:not(:has(div, p)) { margin-bottom: 1.5em !important; }');
    expect(css).not.toContain('div { margin-bottom:');
  });

  it('들여쓰기는 값이 있을 때만 문단 블록에 넣는다', () => {
    const base = defaultReaderStyle('phone');
    expect(readerCss(base, 'phone')).not.toContain('text-indent:');
    expect(readerCss({ ...base, indent: 1.2 }, 'phone')).toContain('text-indent: 1.2em !important');
  });

  it('화면 모드별 본문색과 배경색을 적용한다', () => {
    expect(readerCss(defaultReaderStyle('eink'), 'eink')).toContain('color: #000000 !important; background: #ffffff !important');
    expect(readerCss(defaultReaderStyle('phone'), 'phone')).toContain('color: #221f1c !important; background: #fffdf6 !important');
  });

  it('굵기 보정 선택자는 이미지와 svg를 포함하지 않는다', () => {
    const css = readerCss({ ...defaultReaderStyle('eink'), fontWeight: 700 }, 'eink');
    expect(css).toContain('-webkit-text-stroke: 0.5px !important');
    const weightedRule = css.slice(css.indexOf('body, p, div'));
    expect(weightedRule.split('{')[0]).not.toMatch(/img|svg/);
  });
});
