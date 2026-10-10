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
