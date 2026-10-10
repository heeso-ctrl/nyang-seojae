import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import * as M from './layers.mjs';

const D = { LINE: M.LINE, SIL_D: M.SIL_D, FURS: M.FURS, base: M.base, STATES: M.STATES, ITEMS: M.ITEMS, THEMES: M.THEMES };
const SHARED = readFileSync(new URL('./shared.js', import.meta.url), 'utf8');
const F = new Function(SHARED + '; return { nyCat, nyHome, nyTower, nyVars, nyShelf };')();
const OUT = new URL('./build/', import.meta.url).pathname; // 결과를 확인한 뒤 build/assets/cat 을 저장소의 assets/cat 으로 복사
rmSync(OUT, { recursive: true, force: true });
for (const d of ['assets/cat/items', 'assets/cat/states', 'assets/cat/themes']) mkdirSync(OUT + d, { recursive: true });

// ---------- 에셋 파일 ----------
const v = sel => F.nyVars(D, Object.assign({ theme: 'plain' }, sel));
const catFile = (inner, fur = 'white') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style="${v({ fur })}">${inner}</svg>\n`;
for (const k of ['tail', 'body', 'line', 'feet']) writeFileSync(`${OUT}assets/cat/${k}.svg`, catFile(M.base[k]));
for (const [k, s] of Object.entries(M.STATES)) {
  writeFileSync(`${OUT}assets/cat/states/${k}-face.svg`, catFile(s.face));
  if (s.prop) writeFileSync(`${OUT}assets/cat/states/${k}-prop.svg`, catFile(s.prop));
}
for (const it of M.ITEMS) {
  const inner = (it.clip ? `<defs><clipPath id="sil"><path d="${M.SIL_D}"/></clipPath></defs><g clip-path="url(#sil)">${it.svg}</g>` : it.svg) + (it.over || '');
  writeFileSync(`${OUT}assets/cat/items/${it.id}.svg`, catFile(inner));
}
for (const [k] of Object.entries(M.THEMES)) {
  for (const n of [0, 24, 60]) writeFileSync(`${OUT}assets/cat/themes/${k}-books${n}.svg`, F.nyHome(D, { state: 'reading', fur: 'white', theme: k }, n, `${k}${n}`) + '\n');
}
writeFileSync(`${OUT}assets/cat/tower-sample.svg`, F.nyTower(D, { state: 'reading', fur: 'white', theme: 'study' }, M.SAMPLE_TITLES.slice(0, 12), 'tw') + '\n');
// 코드에서 바로 쓰는 그리기 모듈
writeFileSync(`${OUT}assets/cat/nyang-art.js`,
  `// 냥서재 그림 모듈 (자동 생성). 고양이·방·책장·책탑을 SVG 문자열로 만든다.\n// 사용: import { D, nyHome, nyTower } from './nyang-art.js'; el.innerHTML = nyHome(D, {state:'reading', fur:'white', theme:'plain', hat:'', outfit:''}, 읽은책수, 'home');\n` +
  `export const D = ${JSON.stringify(D)};\n` + SHARED + `\nexport { nyRand, nyVars, nyCat, nyShelf, nyHome, nyTower };\n`);
const manifest = {
  catViewBox: '0 0 200 200', homeViewBox: '0 0 360 440', catInHome: 'translate(28 121) scale(1.32)', timerCardCovers: 'bottom ~60px of the home scene',
  layerOrder: ['tail', 'body', 'outfit(clip=silhouette)', 'line', 'outfit-over', 'feet', 'face', 'hat', 'prop'],
  silhouettePath: M.SIL_D, furs: M.FURS,
  states: Object.fromEntries(Object.entries(M.STATES).map(([k, s]) => [k, { name: s.name, face: `states/${k}-face.svg`, prop: s.prop ? `states/${k}-prop.svg` : null }])),
  items: M.ITEMS.map(i => ({ id: i.id, slot: i.slot, name: i.name, price: i.price, file: `items/${i.id}.svg` })),
  themes: Object.fromEntries(Object.entries(M.THEMES).map(([k, t]) => [k, { name: t.name, wall: t.wall, floor: t.floor, wood: t.wood, spines: t.spines, zzColor: t.zz }])),
  shelf: { rows: 5, fillOrder: 'top row first, left to right, around fixed props; every 6 standing books a 2-3 book flat stack', overflow: 'up to 8 books lie on the floor at right, then a +N badge' },
};
writeFileSync(`${OUT}assets/cat/items.json`, JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(`${OUT}assets/cat/README.md`, `# 냥서재 그림 (v2, 부드러운 선)

- 가장 쉬운 사용법: \`nyang-art.js\`의 \`nyHome(D, sel, 읽은책수, uid)\`, \`nyTower(D, sel, 제목배열, uid)\`. SVG 문자열을 돌려준다.
- 고양이 레이어 좌표: viewBox \`0 0 200 200\`. 겹치는 순서: ${manifest.layerOrder.join(' → ')}
- 털색은 CSS 변수(--fur, --fur-dark, --belly, --face, --nose, --ear-in, --blush, --book, --mug, --zz). 값은 items.json의 furs.
- 홈 방: viewBox 0 0 360 440 세로형. 아래 60px쯤은 타이머 카드가 덮는다.
- 책장: 5칸, 위 칸부터 채움(아래 칸은 고양이·빈백에 가려짐). 칸마다 고정 소품(화분, 액자·작은 고양이, 유리병, 수납 상자)이 있고, 세운 책 6권마다 2~3권을 눕혀 쌓음. 칸이 다 차면 바닥 오른쪽에 8권까지 눕혀 쌓고 그 뒤는 +N. 책 모양·색은 시드 고정 난수라 같은 수면 늘 같은 그림.
- 선 굵기 위계: 고양이 > 빈백 > 가구 > 책장 속 책 > 창밖 풍경. 가구 선 색은 테마의 soft 색.
- themes/ 폴더: 테마별 책 0·24·60권 예시.
- 이 그림들은 냥서재용으로 새로 그린 것이다.
`);

// ---------- 미리보기 페이지 ----------
const page = `<title>냥서재 고양이 시안</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap">
<style>
/* 전자종이 한 장. 왼쪽(위)은 앱 화면 시안, 오른쪽(아래)은 고르는 칸. 선택은 검정 면으로 뒤집기. */
:root {
  --paper: #FFFFFF;
  --ink: #2A2420;
  --ink-soft: #5E564F;
  --rule: #D6CFC5;
  --chip: #F4F1EC;
  --focus: #3F6A96;
  --font-display: "Jua", "Gowun Dodum", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  --font-body: "Gowun Dodum", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
  color-scheme: light;
}
html, body { background: var(--paper); color: var(--ink); }
body { font-family: var(--font-body); font-size: 17px; line-height: 1.6; padding-inline: 16px; padding-block: 20px 48px; }
.wrap { max-width: 1060px; margin-inline: auto; display: grid; gap: 28px; }
header { display: grid; gap: 6px; }
h1, h2 { font-family: var(--font-display); font-weight: 400; margin: 0; text-wrap: balance; line-height: 1.25; }
h1 { font-size: 2rem; }
h2 { font-size: 1.45rem; }
.lede { margin: 0; color: var(--ink-soft); max-width: 62ch; }
.main { display: grid; gap: 24px; grid-template-columns: 1fr; align-items: start; }
@media (min-width: 880px) { .main { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); } }
.phone { border: 3px solid var(--ink); border-radius: 22px; overflow: hidden; background: var(--paper); display: grid; max-width: 520px; width: 100%; justify-self: center; }
.stage svg { display: block; width: 100%; height: auto; }
.sim-color svg { filter: saturate(0.55) contrast(0.92) brightness(1.04); }
.sim-mono svg { filter: grayscale(1) contrast(1.05); }
.timer { position: relative; margin: -64px 12px 12px; background: var(--paper); border: 2px solid var(--ink); border-radius: 16px; padding: 10px 12px 12px; display: grid; gap: 10px; }
.timer-top { display: flex; gap: 10px; align-items: center; min-width: 0; }
.cover { width: 32px; height: 44px; border: 1.5px solid var(--ink); border-radius: 3px; background: #7FA6CF; flex: none; display: grid; place-items: center; }
.cover span { width: 14px; height: 14px; border-radius: 50%; background: #FFFDF8; border: 1.5px solid var(--ink); }
.timer-txt { min-width: 0; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; column-gap: 10px; }
.timer-label { font-size: 0.85rem; color: var(--ink-soft); grid-column: 1 / -1; line-height: 1.3; }
.timer-title { font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; }
.timer-time { font-family: var(--font-display); font-size: 1.75rem; line-height: 1.1; font-variant-numeric: tabular-nums; }
.timer-btns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.timer-btns button { min-height: 44px; padding: 0 6px; white-space: nowrap; font-size: 0.95rem; border-width: 1.5px; border-radius: 12px; }
.timer .note { font-size: 0.85rem; line-height: 1.4; min-height: 0; }
.controls { display: grid; gap: 18px; min-width: 0; }
fieldset { border: 0; margin: 0; padding: 0; display: grid; gap: 8px; min-width: 0; }
legend { font-family: var(--font-display); font-size: 1.15rem; padding: 0; margin-bottom: 8px; }
.opts { display: flex; flex-wrap: wrap; gap: 8px; }
.opts input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.opts label { min-height: 48px; min-width: 64px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 2px solid var(--ink); border-radius: 999px; background: var(--paper); color: var(--ink); cursor: pointer; font-size: 1rem; }
.opts input:checked + label { background: var(--ink); color: var(--paper); }
.opts input:focus-visible + label { outline: 3px solid var(--focus); outline-offset: 2px; }
.price { font-size: 0.85rem; font-variant-numeric: tabular-nums; opacity: 0.75; }
.swatch { width: 18px; height: 18px; border-radius: 50%; border: 2px solid currentColor; }
.count { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.count output { font-family: var(--font-display); font-size: 1.6rem; min-width: 3.2ch; text-align: center; font-variant-numeric: tabular-nums; }
.count input[type=range] { flex: 1 1 160px; min-width: 0; accent-color: var(--ink); height: 32px; }
button { min-height: 48px; padding: 0 14px; border: 2px solid var(--ink); border-radius: 10px; background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
button.sq { width: 48px; padding: 0; font-size: 1.4rem; }
button:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.note { margin: 0; font-size: 0.95rem; color: var(--ink-soft); min-height: 1.6em; }
.recap { display: grid; gap: 16px; }
.recap-grid { display: grid; gap: 20px; grid-template-columns: 1fr; align-items: start; }
@media (min-width: 880px) { .recap-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 2.5px solid var(--ink); border-radius: 14px; padding: 12px 6px; text-align: center; }
.stats div { display: grid; gap: 2px; min-width: 0; }
.stats small { color: var(--ink-soft); font-size: 0.9rem; }
.stats b { font-family: var(--font-display); font-weight: 400; font-size: 1.5rem; font-variant-numeric: tabular-nums; }
.tower { max-width: 340px; margin-inline: auto; width: 100%; }
.tower svg { display: block; width: 100%; height: auto; }
.notes { border-top: 2px solid var(--rule); padding-top: 16px; display: grid; gap: 6px; color: var(--ink-soft); font-size: 0.95rem; }
.notes p { margin: 0; max-width: 70ch; }
</style>

<div class="wrap">
  <header>
    <h1>냥서재 고양이 시안</h1>
    <p class="lede">고양이를 키우고, 빈백·독서등·창밖 풍경을 더한 방입니다. 책장은 다 읽은 책 수만큼 위 칸부터 채워집니다. BOOX에서 열어 색과 선을 확인해 보세요.</p>
  </header>

  <div class="main">
    <div class="phone" id="phone">
      <div class="stage" id="stage"></div>
      <div class="timer">
        <div class="timer-top">
          <div class="cover" aria-hidden="true"><span></span></div>
          <div class="timer-txt">
            <span class="timer-label" id="tLabel">고양이와 읽는 중</span>
            <span class="timer-title">작은 별의 지도</span>
            <span class="timer-time" id="tTime">12분</span>
          </div>
        </div>
        <div class="timer-btns">
          <button type="button" id="bPause">일시 정지</button>
          <button type="button" id="bEnd">독서 종료</button>
          <button type="button" id="bQuote">문장 담기</button>
        </div>
        <p class="note" id="tNote" aria-live="polite" hidden></p>
      </div>
    </div>

    <div class="controls" id="controls">
      <fieldset>
        <legend>책장에 꽂힌 책 (다 읽은 책 수)</legend>
        <div class="count">
          <button type="button" class="sq" id="minus" aria-label="한 권 빼기">−</button>
          <output id="countOut">24</output>
          <button type="button" class="sq" id="plus" aria-label="한 권 더하기">+</button>
          <input type="range" id="countRange" min="0" max="90" value="24" aria-label="책 수">
        </div>
      </fieldset>
    </div>
  </div>

  <section class="recap" aria-labelledby="recapH">
    <h2 id="recapH">결산 책탑</h2>
    <div class="recap-grid">
      <div class="stats" id="stats"></div>
      <div class="tower" id="tower"></div>
    </div>
    <p class="note">책 제목과 숫자는 예시입니다. 앱에서는 실제로 다 읽은 책이 아래부터 쌓이고, 맨 위에 고양이가 앉습니다. 30권이 넘으면 최근 30권만 그립니다.</p>
  </section>

  <div class="notes">
    <p>‘컬러 e잉크 흉내’는 노트북에서 대략 짐작하려고 채도를 낮춘 것입니다. 실제 색은 BOOX에서 확인해야 합니다.</p>
    <p>그림은 냥서재용으로 새로 그린 오리지널입니다.</p>
  </div>
</div>

<script>
const D = ${JSON.stringify(D)};
const TITLES = ${JSON.stringify(M.SAMPLE_TITLES)};
${SHARED}

const sel = { state: 'reading', fur: 'white', hat: '', outfit: '', theme: 'plain', view: 'orig', count: 24 };
try { const s = JSON.parse(localStorage.getItem('nyang-sel-v2') || 'null'); if (s) Object.assign(sel, s); } catch (e) {}

const groups = [
  { key: 'state', label: '상태', opts: Object.entries(D.STATES).map(([v, s]) => ({ v, t: s.name })) },
  { key: 'fur', label: '털색', opts: Object.entries(D.FURS).map(([v, f]) => ({ v, t: f.name, sw: f.fur })) },
  { key: 'hat', label: '모자', opts: [{ v: '', t: '없음' }].concat(D.ITEMS.filter(i => i.slot === 'hat').map(i => ({ v: i.id, t: i.name, p: i.price }))) },
  { key: 'outfit', label: '옷', opts: [{ v: '', t: '없음' }].concat(D.ITEMS.filter(i => i.slot === 'outfit').map(i => ({ v: i.id, t: i.name, p: i.price }))) },
  { key: 'theme', label: '방 테마', opts: Object.entries(D.THEMES).map(([v, t]) => ({ v, t: t.name })) },
  { key: 'view', label: '화면 보기', opts: [{ v: 'orig', t: '원본 색' }, { v: 'color', t: '컬러 e잉크 흉내' }, { v: 'mono', t: '흑백' }] },
];
const ctl = document.getElementById('controls');
for (const g of groups) {
  const fs = document.createElement('fieldset');
  const lg = document.createElement('legend'); lg.textContent = g.label; fs.appendChild(lg);
  const box = document.createElement('div'); box.className = 'opts';
  for (const o of g.opts) {
    const id = g.key + '-' + (o.v || 'none');
    const inp = document.createElement('input');
    inp.type = 'radio'; inp.name = g.key; inp.id = id; inp.value = o.v; inp.checked = sel[g.key] === o.v;
    inp.addEventListener('change', () => { sel[g.key] = o.v; render(); });
    const lb = document.createElement('label'); lb.htmlFor = id;
    if (o.sw) { const s = document.createElement('span'); s.className = 'swatch'; s.style.background = o.sw; lb.appendChild(s); }
    lb.appendChild(document.createTextNode(o.t));
    if (o.p) { const p = document.createElement('span'); p.className = 'price'; p.textContent = o.p + '코인'; lb.appendChild(p); }
    box.appendChild(inp); box.appendChild(lb);
  }
  fs.appendChild(box); ctl.appendChild(fs);
}

const $ = id => document.getElementById(id);
const startedAt = Date.now() - 12 * 60000;
let pausedAt = null, pausedTotal = 0;
function minutes() { const end = pausedAt || Date.now(); return Math.max(0, Math.floor((end - startedAt - pausedTotal) / 60000)); }

function render() {
  const phone = $('phone');
  phone.classList.toggle('sim-color', sel.view === 'color');
  phone.classList.toggle('sim-mono', sel.view === 'mono');
  $('stage').innerHTML = nyHome(D, sel, sel.count, 'home');
  phone.style.background = D.THEMES[sel.theme].floor;
  $('countOut').textContent = sel.count;
  $('countRange').value = sel.count;
  $('tLabel').textContent = sel.state === 'reading' ? '고양이와 읽는 중' : sel.state === 'resting' ? '잠깐 쉬는 중' : sel.state === 'sleeping' ? '고양이가 자는 중' : '독서를 마쳤어요';
  $('tTime').textContent = minutes() + '분';
  $('bPause').textContent = sel.state === 'resting' ? '다시 읽기' : '일시 정지';
  for (const g of ['state']) { const el = document.getElementById(g + '-' + sel[g]); if (el) el.checked = true; }
  // 결산
  const n = sel.count, shown = Math.min(n, 30);
  const titles = []; for (let k = n - shown; k < n; k++) titles.push(TITLES[k % TITLES.length]);
  $('tower').innerHTML = shown ? nyTower(D, sel, titles, 'tower') : '<p class="note">아직 다 읽은 책이 없어요.</p>';
  const stat = (l, v) => '<div><small>' + l + '</small><b>' + v + '</b></div>';
  $('stats').innerHTML = stat('권', n) + stat('쪽', (n * 236).toLocaleString('ko-KR')) + stat('시간', Math.round(n * 4.3)) + stat('문장', Math.round(n * 2.6));
  try { localStorage.setItem('nyang-sel-v2', JSON.stringify(sel)); } catch (e) {}
}
function note(t) { const el = $('tNote'); el.textContent = t; el.hidden = !t; }
function setCount(c) { sel.count = Math.max(0, Math.min(90, c)); render(); }
$('minus').addEventListener('click', () => setCount(sel.count - 1));
$('plus').addEventListener('click', () => setCount(sel.count + 1));
$('countRange').addEventListener('input', e => setCount(+e.target.value));
$('bPause').addEventListener('click', () => {
  if (sel.state === 'resting') { if (pausedAt) pausedTotal += Date.now() - pausedAt; pausedAt = null; sel.state = 'reading'; note(''); }
  else { pausedAt = Date.now(); sel.state = 'resting'; note('쉬는 동안은 시간이 멈춥니다.'); }
  render();
});
$('bEnd').addEventListener('click', () => { pausedAt = pausedAt || Date.now(); sel.state = 'idle'; note('앱에서는 여기서 쪽수와 메모를 적고 기록을 저장합니다.'); render(); });
$('bQuote').addEventListener('click', () => { note('앱에서는 문장 입력 창이 열립니다. (시안이라 저장되지 않아요)'); });
setInterval(() => { $('tTime').textContent = minutes() + '분'; }, 30000);
render();
</script>
`;
writeFileSync(`${OUT}nyang-cat-preview.html`, page);
console.log('ok');
