import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'nyang-title-style-test.epub');
const encoder = new TextEncoder();
const files = [
  ['mimetype', 'application/epub+zip'],
  ['META-INF/container.xml', `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`],
  ['OEBPS/content.opf', `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" unique-identifier="id" version="3.0" xml:lang="ko"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">nyang-title-style</dc:identifier><dc:title>제목 시험 epub</dc:title><dc:creator>냥서재 테스트</dc:creator><dc:language>ko</dc:language><meta property="dcterms:modified">2026-10-29T00:00:00Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="styles.css" media-type="text/css"/><item id="c1" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/></spine></package>`],
  ['OEBPS/nav.xhtml', `<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="chapter.xhtml">제목 시험</a></li></ol></nav></body></html>`],
  ['OEBPS/styles.css', `p{margin:1em 0}.title{font-size:2em;font-weight:bold}.small{font-size:.7em}`],
  ['OEBPS/chapter.xhtml', `<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" lang="ko"><head><title>제목 시험</title><link rel="stylesheet" href="styles.css"/></head><body><div class="title" id="title">두 배 크기 제목</div><h2><span id="heading-span">h2 안 제목</span></h2><div id="div-paragraph">div 문단의 보통 글자와 <span class="small" id="small-span">작은 글자</span>를 함께 확인합니다.</div><p id="paragraph-one">첫 번째 p 문단입니다.</p><p id="paragraph-two">두 번째 p 문단입니다.</p></body></html>`],
];

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
