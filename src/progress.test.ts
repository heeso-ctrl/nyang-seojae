import { describe, expect, it } from 'vitest';
import { parseOptionalNumber, resolveProgress } from './progress';

describe('resolveProgress', () => {
  it('직접 입력한 진행률을 우선하고 0도 유효하게 처리한다', () => {
    expect(resolveProgress({ progressInput: '0', pageTo: 60, totalPages: 300, previousProgress: 0.03 })).toBe(0);
  });

  it('직접 입력한 진행률을 0~100%로 제한한다', () => {
    expect(resolveProgress({ progressInput: '-20' })).toBe(0);
    expect(resolveProgress({ progressInput: '140' })).toBe(1);
  });

  it('진행률이 비어 있으면 읽은 쪽과 전체 쪽수로 계산한다', () => {
    expect(resolveProgress({ progressInput: '', pageTo: 60, totalPages: 300, previousProgress: 0.03 })).toBe(0.2);
    expect(resolveProgress({ progressInput: '  ', pageTo: 0, totalPages: 300, previousProgress: 0.03 })).toBe(0);
  });

  it('계산할 값이 없으면 이전 진행률을 유지한다', () => {
    expect(resolveProgress({ progressInput: '', previousProgress: 0.03 })).toBe(0.03);
  });

  it('다 읽음이 체크되면 항상 100%로 처리한다', () => {
    expect(resolveProgress({ progressInput: '12', pageTo: 30, totalPages: 300, previousProgress: 0.03, done: true })).toBe(1);
  });
});

describe('parseOptionalNumber', () => {
  it('빈 입력은 undefined, 0은 숫자 0으로 보존한다', () => {
    expect(parseOptionalNumber('')).toBeUndefined();
    expect(parseOptionalNumber('0')).toBe(0);
  });
});
