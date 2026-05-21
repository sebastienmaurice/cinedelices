/**
 * convert-hero-webp.mjs — Convertit les images hero statiques en WebP
 * Usage : node scripts/convert-hero-webp.mjs
 */
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventDir = join(__dirname, '../app/public/images/event');

const images = [
  { file: 'hero-slide-bienvenue-membre-foreground.png', quality: 80 },
  { file: 'hero-slide-bienvenue-membres-bg.png',        quality: 75 },
  { file: 'hero-slide-breaking-bad-bg.jpg',             quality: 75 },
  { file: 'hero-slide-remy-foreground.png',             quality: 80 },
  { file: 'hero-slide-remy-paris-bg.jpg',               quality: 75 },
  { file: 'hero-slide-walter-breaking-bad-foreground.png', quality: 80 },
];

for (const { file, quality } of images) {
  const input  = join(eventDir, file);
  const output = join(eventDir, file.replace(/\.(png|jpg)$/, '.webp'));

  const before = (await stat(input)).size;
  await sharp(input).webp({ quality }).toFile(output);
  const after  = (await stat(output)).size;

  const pct = Math.round((1 - after / before) * 100);
  console.log(`✅ ${file}`);
  console.log(`   ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB  (-${pct}%)\n`);
}

console.log('🎉 Conversion terminée. Met à jour home.ejs + home.css avec les .webp');
