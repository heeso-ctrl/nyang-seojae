// 냥서재 그림 모듈 (자동 생성). 고양이·방·책장·책탑을 SVG 문자열로 만든다.
// 사용: import { D, nyHome, nyTower } from './nyang-art.js'; el.innerHTML = nyHome(D, {state:'reading', fur:'white', theme:'plain', hat:'', outfit:''}, 읽은책수, 'home');
export const D = {"LINE":"#3A332E","SIL_D":"M100 190 C72 191 50 184 49 162 C48 140 56 127 61 119 C46 108 41 86 49 68 C52 57 53 47 55 37 Q57 26 66 31 C72 36 78 41 85 44 C95 41 105 41 115 44 C122 41 128 36 134 31 Q143 26 145 37 C147 47 148 57 151 68 C159 86 154 108 139 119 C144 127 152 140 151 162 C150 184 128 191 100 190 Z","FURS":{"white":{"name":"하양","fur":"#FFFFFF","dark":"#D9D3CB","belly":"#F6F3EE","face":"#3A332E","nose":"#EFA3A3","earIn":"#F7CFC8","blush":"#F6C2BD"},"cheese":{"name":"치즈","fur":"#F6C08A","dark":"#E39A55","belly":"#FFF3E4","face":"#3A332E","nose":"#E58C86","earIn":"#F8CDBE","blush":"#F2A99E"},"gray":{"name":"회색","fur":"#C9CFD8","dark":"#9DA6B3","belly":"#F2F4F7","face":"#3A332E","nose":"#E59A9A","earIn":"#F3CFCB","blush":"#F0B8B6"},"black":{"name":"까망","fur":"#45424A","dark":"#2E2C33","belly":"#ECEAE7","face":"#FFF7E6","nose":"#F2A2AE","earIn":"#C9848F","blush":"#C46F7D"}},"base":{"tail":"<path d=\"M146 172 C170 171 184 152 178 133 C175 123 165 123 166 132 C170 147 161 159 145 160 Z\" fill=\"var(--fur)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n    <path d=\"M168 127 Q172 128 174 132\" fill=\"none\" stroke=\"var(--fur-dark)\" stroke-width=\"3\" stroke-linecap=\"round\"/>","body":"<path d=\"M100 190 C72 191 50 184 49 162 C48 140 56 127 61 119 C46 108 41 86 49 68 C52 57 53 47 55 37 Q57 26 66 31 C72 36 78 41 85 44 C95 41 105 41 115 44 C122 41 128 36 134 31 Q143 26 145 37 C147 47 148 57 151 68 C159 86 154 108 139 119 C144 127 152 140 151 162 C150 184 128 191 100 190 Z\" fill=\"var(--fur)\"/>\n    <ellipse cx=\"100\" cy=\"160\" rx=\"27\" ry=\"24\" fill=\"var(--belly)\"/>\n    <path d=\"M60 42 Q62 34 68 38 Q74 42 77 45 Q67 47 60 42 Z\" fill=\"var(--ear-in)\"/>\n    <path d=\"M140 42 Q138 34 132 38 Q126 42 123 45 Q133 47 140 42 Z\" fill=\"var(--ear-in)\"/>\n    <path d=\"M94 50 Q96 56 95 61 M100 48 L100 59 M106 50 Q104 56 105 61\" fill=\"none\" stroke=\"var(--fur-dark)\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>\n    <ellipse cx=\"73\" cy=\"97\" rx=\"6.5\" ry=\"3.6\" fill=\"var(--blush)\"/>\n    <ellipse cx=\"127\" cy=\"97\" rx=\"6.5\" ry=\"3.6\" fill=\"var(--blush)\"/>\n    <path d=\"M76 121 Q100 130 124 121\" fill=\"none\" stroke=\"#3A332E\" stroke-width=\"1.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke-opacity=\"0.55\"/>","line":"<path d=\"M100 190 C72 191 50 184 49 162 C48 140 56 127 61 119 C46 108 41 86 49 68 C52 57 53 47 55 37 Q57 26 66 31 C72 36 78 41 85 44 C95 41 105 41 115 44 C122 41 128 36 134 31 Q143 26 145 37 C147 47 148 57 151 68 C159 86 154 108 139 119 C144 127 152 140 151 162 C150 184 128 191 100 190 Z\" fill=\"none\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n    <path d=\"M60 90 L37 86 M60 96 L38 98 M140 90 L163 86 M140 96 L162 98\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>","feet":"<path d=\"M77 190 Q77 179 86 179 Q95 179 95 190\" fill=\"var(--fur)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n    <path d=\"M105 190 Q105 179 114 179 Q123 179 123 190\" fill=\"var(--fur)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n    <path d=\"M86 184 L86 188 M114 184 L114 188\" stroke=\"#3A332E\" stroke-width=\"1.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"},"STATES":{"idle":{"name":"대기","face":"<ellipse cx=\"84\" cy=\"86\" rx=\"3.2\" ry=\"4.3\" fill=\"var(--face)\"/>\n      <ellipse cx=\"116\" cy=\"86\" rx=\"3.2\" ry=\"4.3\" fill=\"var(--face)\"/><ellipse cx=\"100\" cy=\"92.5\" rx=\"2.8\" ry=\"1.9\" fill=\"var(--nose)\"/><path d=\"M94.5 96 Q97.3 100 100 96.5 Q102.7 100 105.5 96\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>","prop":""},"reading":{"name":"읽는 중","face":"<ellipse cx=\"85\" cy=\"89\" rx=\"3\" ry=\"3.4\" fill=\"var(--face)\"/>\n      <ellipse cx=\"115\" cy=\"89\" rx=\"3\" ry=\"3.4\" fill=\"var(--face)\"/><ellipse cx=\"100\" cy=\"92.5\" rx=\"2.8\" ry=\"1.9\" fill=\"var(--nose)\"/>\n      <path d=\"M97 97.5 Q100 99.5 103 97.5\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"1.9\" stroke-linecap=\"round\"/>","prop":"<path d=\"M61 160 Q81 154 100 163 Q119 154 139 160 L139 165 Q119 159 100 168 Q81 159 61 165 Z\" fill=\"var(--book)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M64 129 Q83 123 100 131 Q117 123 136 129 L136 160 Q117 154 100 162 Q83 154 64 160 Z\" fill=\"#FFFDF8\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M100 131 L100 162\" stroke=\"#3A332E\" stroke-width=\"1.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M72 137 Q82 134 92 138 M72 144 Q82 141 92 145 M72 151 Q80 148 88 151 M108 138 Q118 134 128 137 M108 145 Q118 141 128 144 M112 151 Q120 148 128 151\" fill=\"none\" stroke=\"#B8B0A6\" stroke-width=\"1.6\" stroke-linecap=\"round\"/>\n      <path d=\"M55 149 Q54 136 63 136 Q72 136 71 149 Q63 154 55 149 Z\" fill=\"var(--fur)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M129 149 Q128 136 137 136 Q146 136 145 149 Q137 154 129 149 Z\" fill=\"var(--fur)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"},"resting":{"name":"쉬는 중","face":"<path d=\"M79 88 Q84 82 89 88\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>\n      <path d=\"M111 88 Q116 82 121 88\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><ellipse cx=\"100\" cy=\"92.5\" rx=\"2.8\" ry=\"1.9\" fill=\"var(--nose)\"/><path d=\"M94.5 96 Q97.3 100 100 96.5 Q102.7 100 105.5 96\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>","prop":"<path d=\"M94 124 Q90 118 94 112 M105 124 Q101 118 105 112\" fill=\"none\" stroke=\"#9A928A\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n      <path d=\"M114 139 Q127 140 116 154\" fill=\"none\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M85 132 Q85 128 89 128 L111 128 Q115 128 115 132 L114 156 Q114 161 109 161 L91 161 Q86 161 86 156 Z\" fill=\"var(--mug)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M87 140 Q100 143 113 140\" fill=\"none\" stroke=\"#FFFDF8\" stroke-width=\"2.4\" stroke-linecap=\"round\"/>\n      <path d=\"M76 151 Q75 138 84 138 Q93 138 92 151 Q84 156 76 151 Z\" fill=\"var(--fur)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M109 153 Q108 140 117 140 Q126 140 125 153 Q117 158 109 153 Z\" fill=\"var(--fur)\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"},"sleeping":{"name":"자는 중","face":"<path d=\"M79 87 Q84 91 89 87\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>\n      <path d=\"M111 87 Q116 91 121 87\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><ellipse cx=\"100\" cy=\"92.5\" rx=\"2.8\" ry=\"1.9\" fill=\"var(--nose)\"/>\n      <path d=\"M98 97.5 Q100 99 102 97.5\" fill=\"none\" stroke=\"var(--face)\" stroke-width=\"1.9\" stroke-linecap=\"round\"/>","prop":"<path d=\"M150 46 Q157 45 163 45 Q156 52 150 59 Q157 59 164 58\" fill=\"none\" stroke=\"var(--zz)\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n      <path d=\"M170 26 Q175 26 179 26 Q174 31 170 36 Q175 36 180 35\" fill=\"none\" stroke=\"var(--zz)\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"}},"ITEMS":[{"id":"hat-beret","slot":"hat","name":"베레모","price":30,"svg":"\n      <path d=\"M74 47 C71 31 128 28 128 44 C118 53 85 54 74 47 Z\" fill=\"#D8615A\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M103 29 Q104 25 106 22\" fill=\"none\" stroke=\"#3A332E\" stroke-width=\"3\" stroke-linecap=\"round\"/>"},{"id":"hat-earknit","slot":"hat","name":"귀 달린 털모자","price":40,"svg":"\n      <path d=\"M48 68 C46 52 51 38 57 29 Q61 24 67 30 L84 42 Q100 38 116 42 L133 30 Q139 24 143 29 C149 38 154 52 152 68 Z\" fill=\"#7FA6CF\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M47 60 Q100 69 153 60 L153 71 Q100 80 47 71 Z\" fill=\"#5E86B2\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M62 64 L62 70 M76 66 L76 72 M90 67 L90 73 M100 67 L100 74 M110 67 L110 73 M124 66 L124 72 M138 64 L138 70\" stroke=\"#C3D5EA\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>"},{"id":"hat-crown","slot":"hat","name":"작은 왕관","price":60,"svg":"\n      <path d=\"M84 45 L85 25 Q86 23 88 25 L94 34 L99 21 Q100 19 101 21 L106 34 L112 25 Q114 23 115 25 L116 45 Q100 49 84 45 Z\" fill=\"#F3CF63\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <circle cx=\"100\" cy=\"39\" r=\"2.8\" fill=\"#E06A6A\"/>"},{"id":"hat-flower","slot":"hat","name":"꽃 핀","price":15,"svg":"\n      <g stroke=\"#3A332E\" stroke-width=\"1.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"#F6B3C8\">\n        <circle cx=\"127\" cy=\"40\" r=\"5.2\"/><circle cx=\"135\" cy=\"45\" r=\"5.2\"/><circle cx=\"132\" cy=\"54\" r=\"5.2\"/>\n        <circle cx=\"122\" cy=\"54\" r=\"5.2\"/><circle cx=\"119\" cy=\"45\" r=\"5.2\"/>\n      </g><circle cx=\"127\" cy=\"48\" r=\"3.8\" fill=\"#F3CF63\" stroke=\"#3A332E\" stroke-width=\"1.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"},{"id":"outfit-scarf","slot":"outfit","name":"줄무늬 목도리","price":25,"clip":true,"svg":"\n      <path d=\"M44 112 Q100 136 156 112 L156 127 Q100 151 44 127 Z\" fill=\"#E98E6C\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M68 121 L68 134 M84 125 L84 139 M116 125 L116 139 M132 121 L132 134\" stroke=\"#FFF1E2\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>","over":"<path d=\"M118 128 Q126 126 133 124 L137 152 Q130 154 122 157 Z\" fill=\"#E98E6C\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M123 157 L122 163 M128 156 L128 162 M133 154 L134 160\" stroke=\"#3A332E\" stroke-width=\"1.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"},{"id":"outfit-sweater","slot":"outfit","name":"보라 스웨터","price":45,"clip":true,"svg":"\n      <rect x=\"40\" y=\"116\" width=\"120\" height=\"80\" fill=\"#B49AD0\"/>\n      <path d=\"M40 142 Q100 148 160 142 M40 156 Q100 162 160 156\" fill=\"none\" stroke=\"#E2D4F0\" stroke-width=\"5\"/>\n      <path d=\"M58 119 Q100 140 142 119\" fill=\"none\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"},{"id":"outfit-bowtie","slot":"outfit","name":"나비넥타이","price":20,"clip":false,"svg":"","over":"<path d=\"M100 128 Q90 118 83 121 Q80 128 83 135 Q90 138 100 128 Z\" fill=\"#4C79A6\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <path d=\"M100 128 Q110 118 117 121 Q120 128 117 135 Q110 138 100 128 Z\" fill=\"#4C79A6\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      <circle cx=\"100\" cy=\"128\" r=\"4.5\" fill=\"#3A6189\" stroke=\"#3A332E\" stroke-width=\"2.4\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>"}],"THEMES":{"plain":{"name":"선화 기본","zz":"#3A332E","wall":"#FFFFFF","floor":"#F6F4F0","plank":"#D3CCC2","soft":"#3A332E","wood":"#FFFFFF","back":"#FFFFFF","cushion":"#FFFFFF","crease":"#8C847B","pillowA":"#FFFFFF","pillowB":"#E4DFD8","shade":"#FFFFFF","light":null,"table":"#FFFFFF","frame":"#FFFFFF","leaf":"#FFFFFF","pot":"#FFFFFF","paper":"#FFFFFF","mug":"#FFFFFF","jar":"#FFFFFF","box":"#FFFFFF","sky":"#FFFFFF","wallExtra":"","spines":["#FFFFFF","#FFFFFF","#ECE8E2","#3A332E","#FFFFFF","#D9D3CB","#FFFFFF","#FFFFFF","#F1EEE9"],"view":"<path d=\"M22 138 Q48 118 76 132 Q104 110 144 126\" fill=\"none\" stroke=\"#3A332E\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n      <path d=\"M40 66 Q42 56 52 58 Q56 48 66 54 Q76 52 74 62 Q80 68 70 70 L44 70 Q36 70 40 66 Z\" fill=\"#FFFFFF\" stroke=\"#3A332E\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>\n      <path d=\"M100 48 q4 -4 8 0 q4 -4 8 0 M112 62 q3 -3 6 0 q3 -3 6 0\" fill=\"none\" stroke=\"#3A332E\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>"},"study":{"name":"다락 서재","zz":"#3A332E","wall":"#F3EADC","floor":"#D8BB9A","plank":"#BE9D7A","soft":"#5B4636","wood":"#B98B63","back":"#94694A","cushion":"#EBCFA8","crease":"#B9946E","pillowA":"#FFF6E8","pillowB":"#E7B49B","shade":"#F3CF63","light":null,"table":"#B98B63","frame":"#FFF6E8","leaf":"#8DBB8A","pot":"#D98A68","paper":"#FFFDF8","mug":"#8DBB8A","jar":"#CFE3EE","box":"#EBCFA8","sky":"#D6E8F2","wallExtra":"","spines":["#E07B6A","#F3CF63","#7FA6CF","#8DBB8A","#B49AD0","#F6B3C8","#FFFDF8","#E98E6C","#A7C7D9"],"view":"<circle cx=\"52\" cy=\"54\" r=\"10\" fill=\"#F6E2A0\" stroke=\"#5B4636\" stroke-width=\"1\"/>\n      <path d=\"M86 70 Q88 60 98 62 Q102 52 112 58 Q122 56 120 66 Q126 72 116 74 L90 74 Q82 74 86 70 Z\" fill=\"#FFFFFF\" stroke=\"#5B4636\" stroke-width=\"1\" stroke-linejoin=\"round\"/>\n      <path d=\"M22 154 L22 128 Q40 118 58 126 Q76 112 96 124 Q116 114 144 124 L144 154 Z\" fill=\"#BFD9A8\"/>\n      <g fill=\"#8DBB8A\" stroke=\"#5B4636\" stroke-width=\"1\"><circle cx=\"40\" cy=\"128\" r=\"9\"/><circle cx=\"52\" cy=\"124\" r=\"11\"/><circle cx=\"118\" cy=\"122\" r=\"10\"/><circle cx=\"130\" cy=\"126\" r=\"8\"/></g>"},"night":{"name":"밤 창가","zz":"#FFF1C9","wall":"#34405E","floor":"#4A3F5A","plank":"#3A3149","soft":"#1E1A2C","wood":"#5C4C72","back":"#45395A","cushion":"#A99AD4","crease":"#7D6EB0","pillowA":"#ECE7F7","pillowB":"#B6AADA","shade":"#F6E2A0","light":"#44507A","table":"#8A6A50","frame":"#E8E0D0","leaf":"#6FA77A","pot":"#C98A6A","paper":"#EDE6D6","mug":"#FFFDF8","jar":"#F6E2A0","box":"#8A6A50","sky":"#1F2742","wallExtra":"","spines":["#F3CF63","#9FBFE0","#E8A2B4","#A9D0A0","#FFFDF8","#C9B6E4","#F2B48C","#E5E0D6","#7FA6CF"],"view":"<g fill=\"#F6E4A0\"><circle cx=\"36\" cy=\"40\" r=\"1.6\"/><circle cx=\"58\" cy=\"62\" r=\"1.3\"/><circle cx=\"72\" cy=\"38\" r=\"1.5\"/><circle cx=\"98\" cy=\"74\" r=\"1.3\"/><circle cx=\"136\" cy=\"80\" r=\"1.5\"/></g>\n      <circle cx=\"116\" cy=\"52\" r=\"12\" fill=\"#F6E4A0\"/><circle cx=\"122\" cy=\"47\" r=\"11\" fill=\"#1F2742\"/>\n      <path d=\"M22 154 L22 124 L34 124 L34 114 L46 106 L58 114 L58 126 L70 126 L70 110 L84 110 L84 122 L96 122 L96 102 L110 94 L124 102 L124 120 L144 120 L144 154 Z\" fill=\"#2D3858\"/>\n      <g fill=\"#F6D98A\"><rect x=\"38\" y=\"118\" width=\"4\" height=\"5\"/><rect x=\"50\" y=\"118\" width=\"4\" height=\"5\"/><rect x=\"74\" y=\"116\" width=\"4\" height=\"5\"/><rect x=\"104\" y=\"106\" width=\"4\" height=\"5\"/><rect x=\"112\" y=\"112\" width=\"4\" height=\"5\"/><rect x=\"132\" y=\"128\" width=\"4\" height=\"5\"/></g>\n      <g fill=\"#263150\"><circle cx=\"64\" cy=\"140\" r=\"10\"/><circle cx=\"76\" cy=\"136\" r=\"12\"/><circle cx=\"140\" cy=\"140\" r=\"11\"/></g>"},"greenhouse":{"name":"온실","zz":"#3A332E","wall":"#E4EFE0","floor":"#DCCFB0","plank":"#C6B58E","soft":"#3F5240","wood":"#D3BC97","back":"#BCA37C","cushion":"#F3E6C6","crease":"#CDB88C","pillowA":"#FFFDF8","pillowB":"#A9CFA4","shade":"#F6B3C8","light":null,"table":"#C9A27E","frame":"#FFFDF8","leaf":"#7FB07C","pot":"#D98A68","paper":"#FFFDF8","mug":"#F6B3C8","jar":"#CFE3EE","box":"#F3E6C6","sky":"#EAF4E2","wallExtra":"<path d=\"M0 200 L196 200 M60 168 L60 300 M120 200 L120 300\" stroke=\"#C3D8BC\" stroke-width=\"2\"/>","spines":["#8DBB8A","#F3CF63","#F6B3C8","#7FA6CF","#FFFDF8","#E98E6C","#C7DDB9","#B49AD0","#F2D6A2"],"view":"<g fill=\"#9CC59A\" stroke=\"#3F5240\" stroke-width=\"1\"><path d=\"M22 154 Q30 120 50 112 Q48 136 34 154 Z\"/><path d=\"M44 154 Q60 116 86 110 Q80 140 58 154 Z\"/>\n      <path d=\"M144 70 Q120 80 116 104 Q136 100 144 86 Z\"/><path d=\"M144 112 Q118 118 108 146 Q132 142 144 128 Z\"/></g>\n      <g fill=\"#F6B3C8\" stroke=\"#3F5240\" stroke-width=\"1\"><circle cx=\"96\" cy=\"140\" r=\"4\"/><circle cx=\"106\" cy=\"134\" r=\"3.5\"/></g>"}}};
// 화면(미리보기 페이지)과 빌드 스크립트가 같이 쓰는 그리기 함수들.
function nyRand(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function nyVars(D, sel) {
  const f = D.FURS[sel.fur], t = D.THEMES[sel.theme] || { zz: D.LINE };
  return `--fur:${f.fur};--fur-dark:${f.dark};--belly:${f.belly};--face:${f.face};--nose:${f.nose};--ear-in:${f.earIn};--blush:${f.blush};--zz:${t.zz};--book:#7FA6CF;--mug:#8DBB8A`;
}
// 고양이 한 마리 (200x200 좌표). uid는 clipPath 이름 충돌 방지용.
function nyCat(D, sel, uid) {
  const s = D.STATES[sel.state];
  const hat = D.ITEMS.find(i => i.id === sel.hat);
  const out = D.ITEMS.find(i => i.id === sel.outfit);
  return `<defs><clipPath id="sil-${uid}"><path d="${D.SIL_D}"/></clipPath></defs>` +
    D.base.tail + D.base.body +
    (out && out.clip ? `<g clip-path="url(#sil-${uid})">${out.svg}</g>` : '') +
    D.base.line + (out && out.over ? out.over : '') +
    D.base.feet + s.face + (hat ? hat.svg : '') + s.prop;
}
// 책장 (장면 좌표). 칸마다 고정 소품이 있고, 다 읽은 책 수만큼 위 칸부터 채운다.
// 한 칸에 세운 책이 6권 쌓이면 다음 자리에 2~3권을 눕혀 쌓는다(눕힌 책도 한 권씩 센다).
// 칸이 다 차면 바닥 오른쪽에 눕혀 8권까지 쌓고, 그 뒤는 +N.
function nyShelf(D, theme, count, part) {
  const T = D.THEMES[theme], S = T.soft;
  const xL = 196, xR = 356, inL = 204, inR = 348, rows = 5, rowH = 58.4;
  const board = r => (r + 1) * rowH;            // r번째 칸의 바닥 선반 y
  let s = `<rect x="${xL}" y="-4" width="${xR - xL}" height="304" fill="${T.wood}" stroke="${S}" stroke-width="1.8"/>` +
    `<rect x="${inL}" y="0" width="${inR - inL}" height="292" fill="${T.back}" stroke="${S}" stroke-width="1.2"/>`;
  // 칸별 빈 구간 [시작, 끝] (소품 자리를 뺀 곳)
  const free = [[[206, 314]], [[206, 296]], [[230, 346]], [[206, 296]], [[206, 346]]];
  const rnd = nyRand(7);
  const pool = []; for (let i = 0; i < 600; i++) pool.push({ w: 7 + Math.floor(rnd() * 5), h: 0.58 + rnd() * 0.32, c: T.spines[Math.floor(rnd() * T.spines.length)], band: rnd() < 0.45, fw: 26 + Math.floor(rnd() * 8), fk: 2 + Math.floor(rnd() * 2) });
  let pi = 0, placed = 0, books = '';
  for (let r = 0; r < rows && placed < count; r++) {   // 위 칸부터 (아래 칸은 고양이와 빈백에 가려지므로)
    const yb = r === rows - 1 ? 292 : board(r) - 2.5;
    let standing = 0;
    for (const [a, b] of free[r]) {
      let x = a;
      while (placed < count) {
        const p = pool[pi];
        if (standing === 6 && count - placed >= 2 && x + p.fw <= b) {   // 눕힌 책 묶음
          const k = Math.min(p.fk, count - placed);
          for (let j = 0; j < k; j++) {
            const q = pool[pi + j], w = p.fw - j * 2;
            books += `<rect x="${x + j}" y="${(yb - (j + 1) * 6.5).toFixed(1)}" width="${w}" height="6.5" rx="1" fill="${q.c}" stroke="${S}" stroke-width="1.1"/>`;
          }
          x += p.fw + 2; pi += k; placed += k; standing = 0; continue;
        }
        if (x + p.w > b) break;
        const h = Math.round((rowH - 12) * p.h);
        books += `<rect x="${x}" y="${(yb - h).toFixed(1)}" width="${p.w}" height="${h}" rx="1" fill="${p.c}" stroke="${S}" stroke-width="1.1"/>`;
        if (p.band) books += `<path d="M${x + 1.5} ${(yb - h + 5).toFixed(1)} L${x + p.w - 1.5} ${(yb - h + 5).toFixed(1)}" stroke="${S}" stroke-width="0.9"/>`;
        x += p.w; pi++; placed++; standing++;
      }
    }
  }
  s += books;
  for (let r = 0; r < rows - 1; r++) s += `<rect x="${inL}" y="${(board(r) - 2.5).toFixed(1)}" width="${inR - inL}" height="5" fill="${T.wood}" stroke="${S}" stroke-width="1.2"/>`;
  s += `<rect x="${xL}" y="292" width="${xR - xL}" height="8" fill="${T.wood}" stroke="${S}" stroke-width="1.8"/>`;
  // 고정 소품
  const y0 = board(0) - 2.5, y1 = board(1) - 2.5, y2 = board(2) - 2.5, y3 = board(3) - 2.5;
  s += `<g stroke="${S}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">` +
    // 0칸: 늘어지는 화분
    `<path d="M320 ${y0} L318 ${y0 - 15} L344 ${y0 - 15} L342 ${y0} Z" fill="${T.pot}"/>` +
    `<path d="M331 ${y0 - 15} Q322 ${y0 - 32} 312 ${y0 - 30} M331 ${y0 - 15} Q338 ${y0 - 34} 346 ${y0 - 34} M342 ${y0 - 8} Q352 ${y0 + 10} 346 ${y0 + 34}" fill="none"/>` +
    `<g fill="${T.leaf}"><ellipse cx="314" cy="${y0 - 30}" rx="6" ry="3.5" transform="rotate(-20 314 ${y0 - 30})"/><ellipse cx="344" cy="${y0 - 34}" rx="6" ry="3.5" transform="rotate(15 344 ${y0 - 34})"/>` +
    `<ellipse cx="324" cy="${y0 - 24}" rx="5" ry="3" transform="rotate(-40 324 ${y0 - 24})"/><ellipse cx="349" cy="${y0 + 6}" rx="5" ry="3" transform="rotate(60 349 ${y0 + 6})"/>` +
    `<ellipse cx="350" cy="${y0 + 20}" rx="5" ry="3" transform="rotate(80 350 ${y0 + 20})"/><ellipse cx="346" cy="${y0 + 34}" rx="5" ry="3" transform="rotate(100 346 ${y0 + 34})"/></g>` +
    // 1칸: 액자 + 작은 고양이 인형
    `<g transform="rotate(-5 314 ${y1 - 16})"><rect x="300" y="${y1 - 32}" width="28" height="32" rx="1.5" fill="${T.paper}"/><rect x="304" y="${y1 - 28}" width="20" height="24" fill="${T.sky}"/>` +
    `<circle cx="314" cy="${y1 - 16}" r="5" fill="${T.shade}"/></g>` +
    `<path d="M331 ${y1} Q330 ${y1 - 12} 334 ${y1 - 14} L333 ${y1 - 19} L337 ${y1 - 15} Q339 ${y1 - 16} 341 ${y1 - 15} L345 ${y1 - 19} L344 ${y1 - 14} Q348 ${y1 - 12} 347 ${y1} Z" fill="#FFFFFF"/>` +
    `<circle cx="336.5" cy="${y1 - 9}" r="0.9" fill="${D.LINE}" stroke="none"/><circle cx="341.5" cy="${y1 - 9}" r="0.9" fill="${D.LINE}" stroke="none"/>` +
    // 2칸: 유리병
    `<path d="M209 ${y2} L209 ${y2 - 22} Q209 ${y2 - 26} 213 ${y2 - 26} L223 ${y2 - 26} Q227 ${y2 - 26} 227 ${y2 - 22} L227 ${y2} Z" fill="${T.jar}"/>` +
    `<rect x="211" y="${y2 - 31}" width="14" height="5" rx="1" fill="${T.wood}"/>` +
    `<path d="M218 ${y2 - 17} l2 4 4 0.5 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -0.5 Z" fill="${T.shade}" stroke-width="0.8"/>` +
    // 3칸: 수납 상자
    `<rect x="300" y="${y3 - 26}" width="46" height="26" rx="2" fill="${T.box}"/><path d="M300 ${y3 - 18} L346 ${y3 - 18}" fill="none"/><rect x="316" y="${y3 - 13}" width="14" height="5" rx="2" fill="${T.paper}"/>` +
    `</g>`;
  // 넘친 책: 바닥 오른쪽에 눕혀 쌓기 (part === 'floor'일 때만 그린다. 빈백보다 앞에 오도록 따로 부른다)
  if (part !== 'floor') return s;
  s = '';
  const extra = count - placed;
  if (extra > 0) {
    const shown = Math.min(extra, 8);
    for (let k = 0; k < shown; k++) {
      const p = pool[pi + k], w = 34 + (k * 5) % 9, x = 338 - w / 2 + ((k % 3) - 1) * 2, y = 378 - (k + 1) * 7;
      s += `<rect x="${x}" y="${y}" width="${w}" height="7" rx="1.5" fill="${p.c}" stroke="${S}" stroke-width="1.2"/>`;
    }
    if (extra > 8) { const ty = 378 - shown * 7 - 24; s += `<rect x="322" y="${ty}" width="34" height="18" rx="9" fill="#FFFDF8" stroke="${S}" stroke-width="1.4"/><text x="339" y="${ty + 13}" text-anchor="middle" font-size="11" font-family="Gowun Dodum, sans-serif" fill="${D.LINE}">+${extra - 8}</text>`; }
  }
  return s;
}
// 홈 방 (세로형 360x440). 아래 60px 정도는 타이머 카드가 덮는다고 보고 중요한 것을 두지 않는다.
function nyHome(D, sel, count, uid) {
  const T = D.THEMES[sel.theme], S = T.soft, LN = D.LINE;
  const g = (w) => `stroke="${S}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 440" style="${nyVars(D, sel)}" role="img" aria-label="${T.name} 방, 책장에 다 읽은 책 ${count}권">`;
  s += `<defs><clipPath id="win-${uid}"><rect x="22" y="28" width="122" height="126"/></clipPath><clipPath id="pil-${uid}"><rect x="236" y="268" width="56" height="56" rx="8"/></clipPath></defs>`;
  // 벽·바닥
  s += `<rect width="360" height="300" fill="${T.wall}"/>${T.wallExtra}`;
  s += `<rect y="300" width="360" height="140" fill="${T.floor}"/><path d="M0 300 L360 300" ${g(1.8)}/>`;
  s += `<path d="M0 332 L130 332 M170 352 L360 352 M0 404 L210 404 M240 420 L360 420" stroke="${T.plank}" stroke-width="1.2"/>`;
  // 창문 + 풍경
  s += `<rect x="16" y="22" width="134" height="138" fill="${T.frame}" ${g(1.8)}/>`;
  s += `<rect x="22" y="28" width="122" height="126" fill="${T.sky}"/><g clip-path="url(#win-${uid})">${T.view}</g>`;
  s += `<rect x="22" y="28" width="122" height="126" fill="none" ${g(1.2)}/>`;
  s += `<rect x="80.5" y="28" width="5" height="126" fill="${T.frame}" ${g(1.2)}/><rect x="22" y="88.5" width="122" height="5" fill="${T.frame}" ${g(1.2)}/>`;
  s += `<rect x="8" y="158" width="150" height="10" rx="2" fill="${T.frame}" ${g(1.8)}/>`;
  // 창턱 화분과 늘어진 덩굴
  s += `<g ${g(1.3)}><path d="M26 158 L24 142 L50 142 L48 158 Z" fill="${T.pot}"/>` +
    `<path d="M30 142 Q18 160 22 196 Q24 214 18 230 M44 142 Q46 128 58 124 M36 142 Q30 128 22 126" fill="none"/>` +
    `<g fill="${T.leaf}"><ellipse cx="58" cy="124" rx="6" ry="3.5" transform="rotate(-20 58 124)"/><ellipse cx="22" cy="126" rx="6" ry="3.5" transform="rotate(20 22 126)"/>` +
    `<ellipse cx="18" cy="172" rx="5" ry="3" transform="rotate(70 18 172)"/><ellipse cx="25" cy="190" rx="5" ry="3" transform="rotate(110 25 190)"/>` +
    `<ellipse cx="19" cy="210" rx="5" ry="3" transform="rotate(70 19 210)"/><ellipse cx="20" cy="230" rx="5" ry="3" transform="rotate(95 20 230)"/></g></g>`;
  // 벽에 붙인 메모 두 장
  s += `<g ${g(1.2)}><g transform="rotate(-5 172 70)"><rect x="160" y="54" width="26" height="32" fill="${T.paper}"/><rect x="167" y="50" width="12" height="6" fill="${T.pillowB}"/>` +
    `<path d="M173 80 Q170 70 173 62 M173 70 Q178 66 180 62 M173 74 Q168 70 166 66" fill="none"/></g>` +
    `<g transform="rotate(6 178 112)"><rect x="166" y="98" width="24" height="26" fill="${T.paper}"/><rect x="172" y="95" width="12" height="5" fill="${T.pillowB}"/>` +
    `<path d="M178 104 l2 4.5 5 .6 -3.6 3.4 1 4.8 -4.4 -2.4 -4.4 2.4 1 -4.8 -3.6 -3.4 5 -.6 Z" fill="${T.shade}"/></g></g>`;
  // 책장
  s += nyShelf(D, sel.theme, count, 'shelf');
  // 왼쪽 바닥 화분
  s += `<g ${g(1.4)}><g fill="${T.leaf}"><path d="M14 336 Q-6 300 2 268 Q20 294 22 334 Z"/><path d="M18 336 Q26 296 46 282 Q44 316 26 338 Z"/><path d="M10 338 Q-8 330 -12 310 Q8 312 16 334 Z"/></g>` +
    `<path d="M2 376 L6 336 L32 336 L36 376 Z" fill="${T.pot}"/></g>`;
  // 등불 면 (밤 테마)
  if (T.light) s += `<path d="M48 222 L84 214 L138 296 L44 300 Z" fill="${T.light}"/>`;
  // 협탁 + 책 + 컵
  s += `<g ${g(1.8)}><rect x="20" y="304" width="7" height="68" fill="${T.table}"/><rect x="100" y="304" width="7" height="68" fill="${T.table}"/>` +
    `<rect x="10" y="296" width="108" height="9" rx="2" fill="${T.table}"/></g>`;
  s += `<g ${g(1.2)}><rect x="48" y="289" width="42" height="7" rx="1" fill="${T.spines[1]}"/><rect x="51" y="282" width="38" height="7" rx="1" fill="${T.spines[2]}"/><rect x="47" y="275" width="40" height="7" rx="1" fill="${T.spines[3] === '#3A332E' ? '#FFFFFF' : T.spines[3]}"/>` +
    `<path d="M93 278 L93 294 Q93 296 95 296 L106 296 Q108 296 108 294 L108 278 Z" fill="${T.mug}"/><path d="M108 282 Q114 283 108 291" fill="none"/></g>`;
  // 독서등 (협탁 위, 갓은 책 쪽으로)
  s += `<g ${g(1.8)}><ellipse cx="32" cy="294" rx="13" ry="3.5" fill="${T.table === '#FFFFFF' ? '#FFFFFF' : T.shade}"/>` +
    `<path d="M32 292 L28 236 L50 206" fill="none"/><circle cx="28" cy="236" r="2.6" fill="${T.shade}"/>` +
    `<g transform="rotate(32 64 212)"><path d="M46 220 Q46 198 64 198 Q82 198 82 220 Z" fill="${T.shade}"/><path d="M58 220 Q64 226 70 220" fill="${T.paper}"/></g></g>`;
  // 빈백 + 체크 쿠션 (고양이 뒤 오른쪽)
  s += `<path d="M112 376 C98 332 116 286 168 272 C222 258 292 264 318 302 C336 330 332 362 320 376 Z" fill="${T.cushion}" ${g(2.4)}/>`;
  s += `<path d="M150 300 Q168 314 164 338 M276 288 Q286 306 302 314 M206 276 Q226 288 252 282 M298 340 Q308 354 314 370" fill="none" stroke="${T.crease}" stroke-width="1.6" stroke-linecap="round"/>`;
  let ck = '';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) ck += `<rect x="${236 + i * 14}" y="${268 + j * 14}" width="14" height="14" fill="${T.pillowB}"/>`;
  s += `<g transform="rotate(-8 264 296)"><rect x="236" y="268" width="56" height="56" rx="8" fill="${T.pillowA}"/><g clip-path="url(#pil-${uid})">${ck}</g><rect x="236" y="268" width="56" height="56" rx="8" fill="none" ${g(1.8)}/></g>`;
  s += nyShelf(D, sel.theme, count, 'floor');
  // 고양이
  s += `<g transform="translate(28 121) scale(1.32)">${nyCat(D, sel, uid)}</g>`;
  s += `</svg>`;
  return s;
}
// 결산 책탑: 아래가 먼저 읽은 책, 위가 최근. 맨 위에 고양이.
function nyTower(D, sel, titles, uid) {
  const T = D.THEMES[sel.theme], LN = D.LINE, n = titles.length, bh = 22, catH = 112;
  const H = catH + n * bh + 10, rnd = nyRand(11);
  let s = '';
  for (let k = 0; k < n; k++) {
    const w = 130 + Math.floor(rnd() * 70), x = 150 - w / 2 + Math.round((rnd() - 0.5) * 22), y = H - 6 - (k + 1) * bh;
    const c = T.spines[(k * 3 + 1) % T.spines.length];
    const dark = c === '#3A332E';
    s += `<rect x="${x}" y="${y}" width="${w}" height="${bh}" rx="3" fill="${c}" stroke="${LN}" stroke-width="1.8"/>` +
      `<text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" font-size="11.5" font-family="Gowun Dodum, sans-serif" fill="${dark ? '#FFFDF8' : LN}">${titles[k].replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
  }
  const topY = H - 6 - n * bh;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 ${H}" style="${nyVars(D, sel)}" role="img" aria-label="읽은 책 ${n}권 책탑">` + s +
    `<g transform="translate(${150 - 100 * 0.6} ${topY - 190 * 0.6}) scale(0.6)">${nyCat(D, Object.assign({}, sel, { state: 'reading' }), uid)}</g></svg>`;
}

export { nyRand, nyVars, nyCat, nyShelf, nyHome, nyTower };
