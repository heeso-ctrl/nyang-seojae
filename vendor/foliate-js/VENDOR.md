# foliate-js vendor 기록

- 원본: https://github.com/johnfactotum/foliate-js
- 고정 커밋: `78914aef4466eb960965702401634c2cb348e9b1`
- 커밋 날짜: 2026-05-01
- foliate-js 라이선스: MIT (`LICENSE` 포함)
- 포함된 zip.js 라이선스: BSD-3-Clause
- foliate-js가 사용하는 fflate 라이선스: MIT (EPUB 전용 빌드에서는 fflate 파일을 포함하지 않음)

냥서재는 EPUB 경로만 사용한다. `view.js`의 PDF·CBZ·FB2·MOBI 감지 및 동적 import를 제거했고, 해당 포맷의 모듈과 pdf.js를 복사하지 않았다. EPUB 문서의 `script`, 이벤트 처리 속성, `javascript:` URL은 로더에서 제거한다. 나머지 파일은 위 커밋에서 복사했다.

## 냥서재 수정

- `paginator.js`: 뷰어를 닫거나 장을 바꾼 뒤 예약된 `ResizeObserver`, 폰트 로드, `requestAnimationFrame` 콜백이 제거된 iframe 문서에 접근하지 않도록 관찰자를 해제하고 `View`의 로드·렌더·레이아웃·크기 계산 및 `Paginator`의 비동기 이동 경로에 destroyed/document null 가드를 추가했다.
