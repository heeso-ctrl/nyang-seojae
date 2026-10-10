import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'public/art/cat/idle-base.webp');
const outputDirectory = resolve(root, 'public/icons');
const background = { r: 245, g: 240, b: 229, alpha: 1 };

await mkdir(outputDirectory, { recursive: true });

async function makeIcon(size, filename, catScale) {
  const catSize = Math.round(size * catScale);
  const cat = await sharp(source)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(catSize, catSize, {
      fit: 'contain',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background }
  })
    .composite([{ input: cat, gravity: 'centre' }])
    .png()
    .toFile(resolve(outputDirectory, filename));
}

await Promise.all([
  makeIcon(192, 'icon-192.png', 0.76),
  makeIcon(512, 'icon-512.png', 0.76),
  makeIcon(512, 'icon-maskable-512.png', 0.64)
]);

console.log('Generated PNG icons from public/art/cat/idle-base.webp');
