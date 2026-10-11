import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'nyang-reader-test.epub');
const encoder = new TextEncoder();

const files = [
  ['mimetype', 'application/epub+zip'],
  ['META-INF/container.xml', `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`],
  ['OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0" xml:lang="ko"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">nyang-reader-fixture</dc:identifier><dc:title>고양이의 세 장</dc:title><dc:creator>냥서재 테스트</dc:creator><dc:language>ko</dc:language><meta property="dcterms:modified">2026-10-11T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="styles.css" media-type="text/css"/><item id="cover" href="cover.svg" media-type="image/svg+xml" properties="cover-image"/><item id="c1" href="chapter1.xhtml" media-type="application/xhtml+xml"/><item id="c2" href="chapter2.xhtml" media-type="application/xhtml+xml"/><item id="c3" href="chapter3.xhtml" media-type="application/xhtml+xml"/></manifest><spine toc="ncx"><itemref idref="c1"/><itemref idref="c2"/><itemref idref="c3"/></spine></package>`],
  ['OEBPS/nav.xhtml', `<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="ko"><head><title>목차</title></head><body><nav epub:type="toc"><h1>목차</h1><ol><li><a href="chapter1.xhtml">첫 장</a></li><li><a href="chapter2.xhtml">둘째 장</a></li><li><a href="chapter3.xhtml">셋째 장</a></li></ol></nav></body></html>`],
  ['OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="nyang-reader-fixture"/></head><docTitle><text>고양이의 세 장</text></docTitle><navMap><navPoint id="n1" playOrder="1"><navLabel><text>첫 장</text></navLabel><content src="chapter1.xhtml"/></navPoint><navPoint id="n2" playOrder="2"><navLabel><text>둘째 장</text></navLabel><content src="chapter2.xhtml"/></navPoint><navPoint id="n3" playOrder="3"><navLabel><text>셋째 장</text></navLabel><content src="chapter3.xhtml"/></navPoint></navMap></ncx>`],
  ['OEBPS/styles.css', `body { font-family: serif; } h1 { border-bottom: 2px solid #3a332e; } p { line-height: 1.7; }`],
  ['OEBPS/cover.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="540" viewBox="0 0 360 540"><rect width="360" height="540" fill="#d7dfcc"/><rect x="20" y="20" width="320" height="500" fill="none" stroke="#3a332e" stroke-width="4"/><text x="180" y="220" text-anchor="middle" font-size="32" fill="#3a332e">고양이의 세 장</text><text x="180" y="275" text-anchor="middle" font-size="20" fill="#3a332e">냥서재 테스트</text></svg>`],
  ['OEBPS/chapter1.xhtml', chapter('첫 장', '창가의 고양이는 아침 햇살 속에서 첫 문장을 천천히 읽었습니다. '.repeat(35))],
  ['OEBPS/chapter2.xhtml', chapter('둘째 장', '책장을 넘길 때마다 작은 방에는 종이 냄새와 고요한 시간이 차곡차곡 쌓였습니다. '.repeat(35), `<script>globalThis.__NYANG_EPUB_SCRIPT_RAN__=true;parent.__NYANG_EPUB_SCRIPT_RAN__=true;</script>`) ],
  ['OEBPS/chapter3.xhtml', chapter('셋째 장', '마지막 장을 덮은 고양이는 오늘 읽은 마음을 오래 기억하기로 했습니다. '.repeat(35))]
];

function chapter(title, text, extra = '') {
  return `<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" lang="ko"><head><title>${title}</title><link rel="stylesheet" href="styles.css"/></head><body><h1>${title}</h1><p>${text}</p>${extra}</body></html>`;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) { const out = new Uint8Array(2); new DataView(out.buffer).setUint16(0, value, true); return out; }
function u32(value) { const out = new Uint8Array(4); new DataView(out.buffer).setUint32(0, value, true); return out; }
function concat(...parts) { const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0)); let offset = 0; for (const part of parts) { out.set(part, offset); offset += part.length; } return out; }

const locals = [];
const centrals = [];
let offset = 0;
for (const [name, content] of files) {
  const nameBytes = encoder.encode(name);
  const data = encoder.encode(content);
  const crc = crc32(data);
  const local = concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data);
  locals.push(local);
  centrals.push(concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes));
  offset += local.length;
}
const central = concat(...centrals);
const archive = concat(...locals, central, u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(central.length), u32(offset), u16(0));
await mkdir(root, { recursive: true });
await writeFile(output, archive);
console.log(`${output} (${archive.length} bytes)`);
