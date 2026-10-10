# 냥서재 그림 (v2, 부드러운 선)

- 가장 쉬운 사용법: `nyang-art.js`의 `nyHome(D, sel, 읽은책수, uid)`, `nyTower(D, sel, 제목배열, uid)`. SVG 문자열을 돌려준다.
- 고양이 레이어 좌표: viewBox `0 0 200 200`. 겹치는 순서: tail → body → outfit(clip=silhouette) → line → outfit-over → feet → face → hat → prop
- 털색은 CSS 변수(--fur, --fur-dark, --belly, --face, --nose, --ear-in, --blush, --book, --mug, --zz). 값은 items.json의 furs.
- 홈 방: viewBox 0 0 360 440 세로형. 아래 60px쯤은 타이머 카드가 덮는다.
- 책장: 5칸, 위 칸부터 채움(아래 칸은 고양이·빈백에 가려짐). 칸마다 고정 소품(화분, 액자·작은 고양이, 유리병, 수납 상자)이 있고, 세운 책 6권마다 2~3권을 눕혀 쌓음. 칸이 다 차면 바닥 오른쪽에 8권까지 눕혀 쌓고 그 뒤는 +N. 책 모양·색은 시드 고정 난수라 같은 수면 늘 같은 그림.
- 선 굵기 위계: 고양이 > 빈백 > 가구 > 책장 속 책 > 창밖 풍경. 가구 선 색은 테마의 soft 색.
- themes/ 폴더: 테마별 책 0·24·60권 예시.
- 이 그림들은 냥서재용으로 새로 그린 것이다.
