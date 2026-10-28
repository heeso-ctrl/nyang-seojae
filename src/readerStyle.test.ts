import { describe, expect, it } from 'vitest';
import { defaultReaderStyle, migrateReaderStyle, textStrokeFor } from './readerStyle';

describe('리더 설정 변환', () => {
  it('예전 % 글자 크기를 px로 옮긴다', () => {
    expect(migrateReaderStyle({ fontSize: 85, lineHeight: 1.4, margin: 24, fontFamily: 'serif' }, 'phone')).toMatchObject({
      fontSize: 15, lineHeight: 1.4, margin: 24, paragraphSpacing: 0.8, fontWeight: 400, fontFamily: 'serif'
    });
    expect(migrateReaderStyle({ fontSize: 145 }, 'eink').fontSize).toBe(26);
  });

  it('새 단위 설정은 범위와 간격에 맞춰 정리한다', () => {
    expect(migrateReaderStyle({ fontSize: 30, lineHeight: 2.43, paragraphSpacing: 1.46, indent: 1.24, margin: 31, fontWeight: 600 }, 'phone')).toMatchObject({
      fontSize: 30, lineHeight: 2.45, paragraphSpacing: 1.5, indent: 1.2, margin: 32, fontWeight: 600
    });
  });

  it('화면 모드별 기본 굵기와 획 보정을 쓴다', () => {
    expect(defaultReaderStyle('eink').fontWeight).toBe(500);
    expect(defaultReaderStyle('phone').fontWeight).toBe(400);
    expect(([400, 500, 600, 700] as const).map(textStrokeFor)).toEqual([0, 0.2, 0.35, 0.5]);
  });
});
