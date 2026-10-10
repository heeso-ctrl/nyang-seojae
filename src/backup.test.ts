import { describe, expect, it } from 'vitest';
import { preferencesForBackup, preferencesForImport } from './backup';

describe('백업 환경설정 필터', () => {
  it('내보내기에서 카카오 키를 제외한다', () => {
    expect(preferencesForBackup([{ key: 'theme', value: 'moon' }, { key: 'kakaoRestKey', value: 'secret' }])).toEqual([{ key: 'theme', value: 'moon' }]);
  });
  it('가져오기에서 기존 카카오 키를 보존하고 백업 속 키는 무시한다', () => {
    expect(preferencesForImport(
      [{ key: 'kakaoRestKey', value: 'device-key' }],
      [{ key: 'theme', value: 'sea' }, { key: 'kakaoRestKey', value: 'backup-key' }]
    )).toEqual([{ key: 'theme', value: 'sea' }, { key: 'kakaoRestKey', value: 'device-key' }]);
  });
});
