# 그림 원본

- `layers.mjs`: 고양이·아이템·테마 원본. 새 모자/옷/테마는 여기에 추가.
- `shared.js`: 고양이·방·책장·책탑 그리는 함수(앱과 미리보기가 같이 씀).
- `node build.mjs` → `build/` 아래에 assets/cat 전체와 미리보기 페이지 생성. 확인 후 저장소 `assets/cat/`로 복사.

## 그림 테마 (v4)
- `../../art/PROMPTS.md`: GPT에 붙일 프롬프트.
- `bench.html`: 받은 그림을 겹쳐 보고 정렬값(align.json)을 복사하는 작업대. 브라우저로 열면 됨.
- `keyout.mjs`: 자홍색 배경을 투명 webp로. `npm i sharp` 후 `node keyout.mjs 입력폴더 출력폴더`.
