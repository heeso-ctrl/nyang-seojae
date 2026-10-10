# AGENTS.md — 냥서재

작업 기준은 SPEC.md(v5)다. 요약:

- 개인용·비상업 독서 기록 PWA. 주 기기는 BOOX Go Color 7 (Gen II), Android 13, 컬러 e잉크, 카메라 없음(추정).
- 프론트엔드 전용(서버·로그인·추적 SDK 없음). 데이터는 IndexedDB(Dexie), JSON 백업 필수.
- 한 번에 한 단계만 구현하고 멈춘다. 단계가 끝나면 CHECKLIST.md에 기기 테스트 항목을 적는다.
- e-ink 규칙(SPEC 3장): 애니메이션·그림자·그라데이션 금지, 터치 영역 48px 이상, 타이머는 분 단위.
- 홈 그림 = public/art/의 배경·고양이 이미지 + align.json. 2:3 그림 상자 안에서 % 좌표로 겹치고 상자는 아래쪽 맞춤(SPEC 7-1). 흑백 모드만 assets/cat/nyang-art.js 선화. 그림을 새로 그리거나 다른 앱 그림을 쓰지 않는다.
- 책장 책 수 = status 'done' 책 수. 책탑 순서 = finishedAt 순.
- 기기에서만 확인할 수 있는 동작은 `// DEVICE-CHECK:` 주석. UI 문구는 한국어.
