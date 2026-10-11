# foliate-js vendor 기록

- 원본: https://github.com/johnfactotum/foliate-js
- 고정 커밋: `78914aef4466eb960965702401634c2cb348e9b1`
- 커밋 날짜: 2026-05-01
- foliate-js 라이선스: MIT (`LICENSE` 포함)
- 포함된 zip.js 라이선스: BSD-3-Clause
- foliate-js가 사용하는 fflate 라이선스: MIT (EPUB 전용 빌드에서는 fflate 파일을 포함하지 않음)

냥서재는 EPUB 경로만 사용한다. `view.js`의 PDF·CBZ·FB2·MOBI 감지 및 동적 import를 제거했고, 해당 포맷의 모듈과 pdf.js를 복사하지 않았다. EPUB 문서의 `script`, 이벤트 처리 속성, `javascript:` URL은 로더에서 제거한다. 나머지 파일은 위 커밋에서 복사했다.
