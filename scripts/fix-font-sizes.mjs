import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const cssDir = join(__dir, '../app/public/css');

const files = [
  'footer.css',
  'author-page.css', 
  'home.css',
  'contact-about.css',
  'base.css',
  'user-profile.css',
  'movies.css',
  'recipe-detail.css',
  'all-recipes.css',
  'add-recipes-movies.css',
  'cookie-banner.css',
];

// Règles de remplacement : [regex, remplacement, description]
const rules = [
  // 0.4rem → 0.6rem (extrême)
  [/font-size:\s*0\.4rem/g, 'font-size: 0.6rem', '0.4→0.6'],
  // 0.44-0.49rem → 0.62rem
  [/font-size:\s*0\.4[4-9]rem/g, 'font-size: 0.62rem', '0.4x→0.62'],
  // 0.5rem → 0.68rem
  [/font-size:\s*0\.5rem/g, 'font-size: 0.68rem', '0.5→0.68'],
  // 0.52-0.56rem → 0.68rem (très petits)
  [/font-size:\s*0\.5[2-6]rem/g, 'font-size: 0.68rem', '0.5x→0.68'],
];

let totalChanges = 0;

for (const file of files) {
  const path = join(cssDir, file);
  let content;
  try { content = readFileSync(path, 'utf8'); } 
  catch { console.log(`⚠️  ${file} non trouvé`); continue; }

  let changed = 0;
  let newContent = content;
  for (const [regex, replacement, desc] of rules) {
    const matches = (newContent.match(regex) || []).length;
    if (matches > 0) {
      newContent = newContent.replace(regex, replacement);
      changed += matches;
      console.log(`  ${file}: ${matches}× ${desc}`);
    }
  }

  if (changed > 0) {
    writeFileSync(path, newContent);
    totalChanges += changed;
  }
}

console.log(`\n✅ ${totalChanges} corrections appliquées`);
