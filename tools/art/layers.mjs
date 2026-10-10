// 냥서재 고양이 v2 — 부드러운 선(라인아트) 버전.
// 고양이 레이어: viewBox 0 0 200 200. 홈 방: 0 0 360 440 (고양이는 translate(28 121) scale(1.32)).

export const LINE = '#3A332E';
const W = 2.4;
const L = `stroke="${LINE}" stroke-width="${W}" stroke-linejoin="round" stroke-linecap="round"`;
const Lt = `stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`;

// 머리와 몸이 한 줄로 이어지는 실루엣 (귀 끝은 둥글게)
export const SIL_D =
  'M100 190 C72 191 50 184 49 162 C48 140 56 127 61 119 C46 108 41 86 49 68 ' +
  'C52 57 53 47 55 37 Q57 26 66 31 C72 36 78 41 85 44 C95 41 105 41 115 44 ' +
  'C122 41 128 36 134 31 Q143 26 145 37 C147 47 148 57 151 68 C159 86 154 108 139 119 ' +
  'C144 127 152 140 151 162 C150 184 128 191 100 190 Z';

export const FURS = {
  white:  { name: '하양', fur: '#FFFFFF', dark: '#D9D3CB', belly: '#F6F3EE', face: LINE, nose: '#EFA3A3', earIn: '#F7CFC8', blush: '#F6C2BD' },
  cheese: { name: '치즈', fur: '#F6C08A', dark: '#E39A55', belly: '#FFF3E4', face: LINE, nose: '#E58C86', earIn: '#F8CDBE', blush: '#F2A99E' },
  gray:   { name: '회색', fur: '#C9CFD8', dark: '#9DA6B3', belly: '#F2F4F7', face: LINE, nose: '#E59A9A', earIn: '#F3CFCB', blush: '#F0B8B6' },
  black:  { name: '까망', fur: '#45424A', dark: '#2E2C33', belly: '#ECEAE7', face: '#FFF7E6', nose: '#F2A2AE', earIn: '#C9848F', blush: '#C46F7D' },
};

export const base = {
  tail: `<path d="M146 172 C170 171 184 152 178 133 C175 123 165 123 166 132 C170 147 161 159 145 160 Z" fill="var(--fur)" ${L}/>
    <path d="M168 127 Q172 128 174 132" fill="none" stroke="var(--fur-dark)" stroke-width="3" stroke-linecap="round"/>`,
  body: `<path d="${SIL_D}" fill="var(--fur)"/>
    <ellipse cx="100" cy="160" rx="27" ry="24" fill="var(--belly)"/>
    <path d="M60 42 Q62 34 68 38 Q74 42 77 45 Q67 47 60 42 Z" fill="var(--ear-in)"/>
    <path d="M140 42 Q138 34 132 38 Q126 42 123 45 Q133 47 140 42 Z" fill="var(--ear-in)"/>
    <path d="M94 50 Q96 56 95 61 M100 48 L100 59 M106 50 Q104 56 105 61" fill="none" stroke="var(--fur-dark)" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="73" cy="97" rx="6.5" ry="3.6" fill="var(--blush)"/>
    <ellipse cx="127" cy="97" rx="6.5" ry="3.6" fill="var(--blush)"/>
    <path d="M76 121 Q100 130 124 121" fill="none" ${Lt} stroke-opacity="0.55"/>`,
  line: `<path d="${SIL_D}" fill="none" ${L}/>
    <path d="M60 90 L37 86 M60 96 L38 98 M140 90 L163 86 M140 96 L162 98" fill="none" stroke="var(--face)" stroke-width="1.8" stroke-linecap="round"/>`,
  feet: `<path d="M77 190 Q77 179 86 179 Q95 179 95 190" fill="var(--fur)" ${L}/>
    <path d="M105 190 Q105 179 114 179 Q123 179 123 190" fill="var(--fur)" ${L}/>
    <path d="M86 184 L86 188 M114 184 L114 188" ${Lt}/>`,
};

const nose = `<ellipse cx="100" cy="92.5" rx="2.8" ry="1.9" fill="var(--nose)"/>`;
const mouthW = `<path d="M94.5 96 Q97.3 100 100 96.5 Q102.7 100 105.5 96" fill="none" stroke="var(--face)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`;
const paw = (cx, cy) => `<path d="M${cx - 8} ${cy + 4} Q${cx - 9} ${cy - 9} ${cx} ${cy - 9} Q${cx + 9} ${cy - 9} ${cx + 8} ${cy + 4} Q${cx} ${cy + 9} ${cx - 8} ${cy + 4} Z" fill="var(--fur)" ${L}/>`;

export const STATES = {
  idle: {
    name: '대기',
    face: `<ellipse cx="84" cy="86" rx="3.2" ry="4.3" fill="var(--face)"/>
      <ellipse cx="116" cy="86" rx="3.2" ry="4.3" fill="var(--face)"/>${nose}${mouthW}`,
    prop: '',
  },
  reading: {
    name: '읽는 중',
    face: `<ellipse cx="85" cy="89" rx="3" ry="3.4" fill="var(--face)"/>
      <ellipse cx="115" cy="89" rx="3" ry="3.4" fill="var(--face)"/>${nose}
      <path d="M97 97.5 Q100 99.5 103 97.5" fill="none" stroke="var(--face)" stroke-width="1.9" stroke-linecap="round"/>`,
    prop: `<path d="M61 160 Q81 154 100 163 Q119 154 139 160 L139 165 Q119 159 100 168 Q81 159 61 165 Z" fill="var(--book)" ${L}/>
      <path d="M64 129 Q83 123 100 131 Q117 123 136 129 L136 160 Q117 154 100 162 Q83 154 64 160 Z" fill="#FFFDF8" ${L}/>
      <path d="M100 131 L100 162" ${Lt}/>
      <path d="M72 137 Q82 134 92 138 M72 144 Q82 141 92 145 M72 151 Q80 148 88 151 M108 138 Q118 134 128 137 M108 145 Q118 141 128 144 M112 151 Q120 148 128 151" fill="none" stroke="#B8B0A6" stroke-width="1.6" stroke-linecap="round"/>
      ${paw(63, 145)}${paw(137, 145)}`,
  },
  resting: {
    name: '쉬는 중',
    face: `<path d="M79 88 Q84 82 89 88" fill="none" stroke="var(--face)" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M111 88 Q116 82 121 88" fill="none" stroke="var(--face)" stroke-width="2.2" stroke-linecap="round"/>${nose}${mouthW}`,
    prop: `<path d="M94 124 Q90 118 94 112 M105 124 Q101 118 105 112" fill="none" stroke="#9A928A" stroke-width="2" stroke-linecap="round"/>
      <path d="M114 139 Q127 140 116 154" fill="none" ${L}/>
      <path d="M85 132 Q85 128 89 128 L111 128 Q115 128 115 132 L114 156 Q114 161 109 161 L91 161 Q86 161 86 156 Z" fill="var(--mug)" ${L}/>
      <path d="M87 140 Q100 143 113 140" fill="none" stroke="#FFFDF8" stroke-width="2.4" stroke-linecap="round"/>
      ${paw(84, 147)}${paw(117, 149)}`,
  },
  sleeping: {
    name: '자는 중',
    face: `<path d="M79 87 Q84 91 89 87" fill="none" stroke="var(--face)" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M111 87 Q116 91 121 87" fill="none" stroke="var(--face)" stroke-width="2.2" stroke-linecap="round"/>${nose}
      <path d="M98 97.5 Q100 99 102 97.5" fill="none" stroke="var(--face)" stroke-width="1.9" stroke-linecap="round"/>`,
    prop: `<path d="M150 46 Q157 45 163 45 Q156 52 150 59 Q157 59 164 58" fill="none" stroke="var(--zz)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M170 26 Q175 26 179 26 Q174 31 170 36 Q175 36 180 35" fill="none" stroke="var(--zz)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
};

export const ITEMS = [
  { id: 'hat-beret', slot: 'hat', name: '베레모', price: 30, svg: `
      <path d="M74 47 C71 31 128 28 128 44 C118 53 85 54 74 47 Z" fill="#D8615A" ${L}/>
      <path d="M103 29 Q104 25 106 22" fill="none" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>` },
  { id: 'hat-earknit', slot: 'hat', name: '귀 달린 털모자', price: 40, svg: `
      <path d="M48 68 C46 52 51 38 57 29 Q61 24 67 30 L84 42 Q100 38 116 42 L133 30 Q139 24 143 29 C149 38 154 52 152 68 Z" fill="#7FA6CF" ${L}/>
      <path d="M47 60 Q100 69 153 60 L153 71 Q100 80 47 71 Z" fill="#5E86B2" ${L}/>
      <path d="M62 64 L62 70 M76 66 L76 72 M90 67 L90 73 M100 67 L100 74 M110 67 L110 73 M124 66 L124 72 M138 64 L138 70" stroke="#C3D5EA" stroke-width="1.8" stroke-linecap="round"/>` },
  { id: 'hat-crown', slot: 'hat', name: '작은 왕관', price: 60, svg: `
      <path d="M84 45 L85 25 Q86 23 88 25 L94 34 L99 21 Q100 19 101 21 L106 34 L112 25 Q114 23 115 25 L116 45 Q100 49 84 45 Z" fill="#F3CF63" ${L}/>
      <circle cx="100" cy="39" r="2.8" fill="#E06A6A"/>` },
  { id: 'hat-flower', slot: 'hat', name: '꽃 핀', price: 15, svg: `
      <g ${Lt} fill="#F6B3C8">
        <circle cx="127" cy="40" r="5.2"/><circle cx="135" cy="45" r="5.2"/><circle cx="132" cy="54" r="5.2"/>
        <circle cx="122" cy="54" r="5.2"/><circle cx="119" cy="45" r="5.2"/>
      </g><circle cx="127" cy="48" r="3.8" fill="#F3CF63" ${Lt}/>` },
  { id: 'outfit-scarf', slot: 'outfit', name: '줄무늬 목도리', price: 25, clip: true, svg: `
      <path d="M44 112 Q100 136 156 112 L156 127 Q100 151 44 127 Z" fill="#E98E6C" ${L}/>
      <path d="M68 121 L68 134 M84 125 L84 139 M116 125 L116 139 M132 121 L132 134" stroke="#FFF1E2" stroke-width="2.6" stroke-linecap="round"/>`,
    over: `<path d="M118 128 Q126 126 133 124 L137 152 Q130 154 122 157 Z" fill="#E98E6C" ${L}/>
      <path d="M123 157 L122 163 M128 156 L128 162 M133 154 L134 160" ${Lt}/>` },
  { id: 'outfit-sweater', slot: 'outfit', name: '보라 스웨터', price: 45, clip: true, svg: `
      <rect x="40" y="116" width="120" height="80" fill="#B49AD0"/>
      <path d="M40 142 Q100 148 160 142 M40 156 Q100 162 160 156" fill="none" stroke="#E2D4F0" stroke-width="5"/>
      <path d="M58 119 Q100 140 142 119" fill="none" ${L}/>` },
  { id: 'outfit-bowtie', slot: 'outfit', name: '나비넥타이', price: 20, clip: false, svg: '',
    over: `<path d="M100 128 Q90 118 83 121 Q80 128 83 135 Q90 138 100 128 Z" fill="#4C79A6" ${L}/>
      <path d="M100 128 Q110 118 117 121 Q120 128 117 135 Q110 138 100 128 Z" fill="#4C79A6" ${L}/>
      <circle cx="100" cy="128" r="4.5" fill="#3A6189" ${L}/>` },
];

// 방 테마 v3. 장면은 viewBox 0 0 360 440 (세로형). 창문 안쪽 풍경 좌표: x22~144, y28~154.
// 색 역할: wall 벽, floor 바닥, plank 바닥선, soft 가구 선, wood/back 책장, cushion/crease 빈백, pillowA/B 체크 쿠션,
// shade 독서등 갓, light 등불 면(없으면 null), table 협탁, frame 창틀, leaf/pot 화분, spines 책 색.
export const THEMES = {
  plain: {
    name: '선화 기본', zz: LINE, wall: '#FFFFFF', floor: '#F6F4F0', plank: '#D3CCC2', soft: LINE,
    wood: '#FFFFFF', back: '#FFFFFF', cushion: '#FFFFFF', crease: '#8C847B', pillowA: '#FFFFFF', pillowB: '#E4DFD8',
    shade: '#FFFFFF', light: null, table: '#FFFFFF', frame: '#FFFFFF', leaf: '#FFFFFF', pot: '#FFFFFF', paper: '#FFFFFF',
    mug: '#FFFFFF', jar: '#FFFFFF', box: '#FFFFFF', sky: '#FFFFFF', wallExtra: '',
    spines: ['#FFFFFF', '#FFFFFF', '#ECE8E2', '#3A332E', '#FFFFFF', '#D9D3CB', '#FFFFFF', '#FFFFFF', '#F1EEE9'],
    view: `<path d="M22 138 Q48 118 76 132 Q104 110 144 126" fill="none" stroke="${LINE}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M40 66 Q42 56 52 58 Q56 48 66 54 Q76 52 74 62 Q80 68 70 70 L44 70 Q36 70 40 66 Z" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M100 48 q4 -4 8 0 q4 -4 8 0 M112 62 q3 -3 6 0 q3 -3 6 0" fill="none" stroke="${LINE}" stroke-width="1.2" stroke-linecap="round"/>`,
  },
  study: {
    name: '다락 서재', zz: LINE, wall: '#F3EADC', floor: '#D8BB9A', plank: '#BE9D7A', soft: '#5B4636',
    wood: '#B98B63', back: '#94694A', cushion: '#EBCFA8', crease: '#B9946E', pillowA: '#FFF6E8', pillowB: '#E7B49B',
    shade: '#F3CF63', light: null, table: '#B98B63', frame: '#FFF6E8', leaf: '#8DBB8A', pot: '#D98A68', paper: '#FFFDF8',
    mug: '#8DBB8A', jar: '#CFE3EE', box: '#EBCFA8', sky: '#D6E8F2', wallExtra: '',
    spines: ['#E07B6A', '#F3CF63', '#7FA6CF', '#8DBB8A', '#B49AD0', '#F6B3C8', '#FFFDF8', '#E98E6C', '#A7C7D9'],
    view: `<circle cx="52" cy="54" r="10" fill="#F6E2A0" stroke="#5B4636" stroke-width="1"/>
      <path d="M86 70 Q88 60 98 62 Q102 52 112 58 Q122 56 120 66 Q126 72 116 74 L90 74 Q82 74 86 70 Z" fill="#FFFFFF" stroke="#5B4636" stroke-width="1" stroke-linejoin="round"/>
      <path d="M22 154 L22 128 Q40 118 58 126 Q76 112 96 124 Q116 114 144 124 L144 154 Z" fill="#BFD9A8"/>
      <g fill="#8DBB8A" stroke="#5B4636" stroke-width="1"><circle cx="40" cy="128" r="9"/><circle cx="52" cy="124" r="11"/><circle cx="118" cy="122" r="10"/><circle cx="130" cy="126" r="8"/></g>`,
  },
  night: {
    name: '밤 창가', zz: '#FFF1C9', wall: '#34405E', floor: '#4A3F5A', plank: '#3A3149', soft: '#1E1A2C',
    wood: '#5C4C72', back: '#45395A', cushion: '#A99AD4', crease: '#7D6EB0', pillowA: '#ECE7F7', pillowB: '#B6AADA',
    shade: '#F6E2A0', light: '#44507A', table: '#8A6A50', frame: '#E8E0D0', leaf: '#6FA77A', pot: '#C98A6A', paper: '#EDE6D6',
    mug: '#FFFDF8', jar: '#F6E2A0', box: '#8A6A50', sky: '#1F2742', wallExtra: '',
    spines: ['#F3CF63', '#9FBFE0', '#E8A2B4', '#A9D0A0', '#FFFDF8', '#C9B6E4', '#F2B48C', '#E5E0D6', '#7FA6CF'],
    view: `<g fill="#F6E4A0"><circle cx="36" cy="40" r="1.6"/><circle cx="58" cy="62" r="1.3"/><circle cx="72" cy="38" r="1.5"/><circle cx="98" cy="74" r="1.3"/><circle cx="136" cy="80" r="1.5"/></g>
      <circle cx="116" cy="52" r="12" fill="#F6E4A0"/><circle cx="122" cy="47" r="11" fill="#1F2742"/>
      <path d="M22 154 L22 124 L34 124 L34 114 L46 106 L58 114 L58 126 L70 126 L70 110 L84 110 L84 122 L96 122 L96 102 L110 94 L124 102 L124 120 L144 120 L144 154 Z" fill="#2D3858"/>
      <g fill="#F6D98A"><rect x="38" y="118" width="4" height="5"/><rect x="50" y="118" width="4" height="5"/><rect x="74" y="116" width="4" height="5"/><rect x="104" y="106" width="4" height="5"/><rect x="112" y="112" width="4" height="5"/><rect x="132" y="128" width="4" height="5"/></g>
      <g fill="#263150"><circle cx="64" cy="140" r="10"/><circle cx="76" cy="136" r="12"/><circle cx="140" cy="140" r="11"/></g>`,
  },
  greenhouse: {
    name: '온실', zz: LINE, wall: '#E4EFE0', floor: '#DCCFB0', plank: '#C6B58E', soft: '#3F5240',
    wood: '#D3BC97', back: '#BCA37C', cushion: '#F3E6C6', crease: '#CDB88C', pillowA: '#FFFDF8', pillowB: '#A9CFA4',
    shade: '#F6B3C8', light: null, table: '#C9A27E', frame: '#FFFDF8', leaf: '#7FB07C', pot: '#D98A68', paper: '#FFFDF8',
    mug: '#F6B3C8', jar: '#CFE3EE', box: '#F3E6C6', sky: '#EAF4E2',
    wallExtra: `<path d="M0 200 L196 200 M60 168 L60 300 M120 200 L120 300" stroke="#C3D8BC" stroke-width="2"/>`,
    spines: ['#8DBB8A', '#F3CF63', '#F6B3C8', '#7FA6CF', '#FFFDF8', '#E98E6C', '#C7DDB9', '#B49AD0', '#F2D6A2'],
    view: `<g fill="#9CC59A" stroke="#3F5240" stroke-width="1"><path d="M22 154 Q30 120 50 112 Q48 136 34 154 Z"/><path d="M44 154 Q60 116 86 110 Q80 140 58 154 Z"/>
      <path d="M144 70 Q120 80 116 104 Q136 100 144 86 Z"/><path d="M144 112 Q118 118 108 146 Q132 142 144 128 Z"/></g>
      <g fill="#F6B3C8" stroke="#3F5240" stroke-width="1"><circle cx="96" cy="140" r="4"/><circle cx="106" cy="134" r="3.5"/></g>`,
  },
};

export const SAMPLE_TITLES = [
  '여름의 정원', '작은 별의 지도', '고요한 오후', '내 글: 바다로 가는 편지', '푸른 계단', '오래된 우체국',
  '내 글: 겨울 노트', '빛이 머무는 곳', '물고기의 꿈', '이름 없는 골목', '두 번째 봄', '내 글: 단편 모음 1',
  '종이 비행기', '밤의 도서관', '느린 기차', '내 글: 연재 3화', '안개 속 등대', '레몬 나무 아래',
  '구름 수집가', '내 글: 시 묶음', '먼 곳의 편지', '파란 우산', '숲의 시간', '내 글: 단편 모음 2',
  '눈 내리는 서점', '내 글: 습작 노트', '바람의 방향', '창가의 고양이', '내 글: 연재 4화', '마지막 페이지',
];
