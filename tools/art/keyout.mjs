// 자홍색(#FF00FF) 배경을 투명으로 바꾸고 webp로 저장한다. 작업대 페이지와 같은 방식.
// 사용: npm i sharp
//       node keyout.mjs 입력폴더 출력폴더 [허용범위=80] [색=#ff00ff]
// 예:   node keyout.mjs ./gpt-cats ../../public/art/cat
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import { join, parse } from 'node:path';

const [, , inDir, outDir, tolArg = '80', colArg = '#ff00ff'] = process.argv;
if (!inDir || !outDir) { console.log('사용: node keyout.mjs 입력폴더 출력폴더 [허용범위] [색]'); process.exit(1); }
const tol = Number(tolArg);
const kr = parseInt(colArg.slice(1, 3), 16), kg = parseInt(colArg.slice(3, 5), 16), kb = parseInt(colArg.slice(5, 7), 16);
mkdirSync(outDir, { recursive: true });

for (const f of readdirSync(inDir)) {
  if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
  const { data, info } = await sharp(join(inDir, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const dist = Math.sqrt((data[i] - kr) ** 2 + (data[i + 1] - kg) ** 2 + (data[i + 2] - kb) ** 2);
    if (dist < tol) data[i + 3] = 0;
    else if (dist < tol * 1.6) {
      const a = (dist - tol) / (tol * 0.6);
      data[i + 3] = Math.round(data[i + 3] * a);
      const m = Math.min(data[i], data[i + 2]);
      if (data[i + 1] < m) { data[i] = Math.round(data[i] * a + data[i + 1] * (1 - a)); data[i + 2] = Math.round(data[i + 2] * a + data[i + 1] * (1 - a)); }
    }
  }
  const out = join(outDir, parse(f).name + '.webp');
  await sharp(data, { raw: info }).webp({ quality: 90, alphaQuality: 100 }).toFile(out);
  console.log('저장', out);
}
