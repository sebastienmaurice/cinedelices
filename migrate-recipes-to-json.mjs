/**
 * migrate-recipes-to-json.mjs
 * Migre les recettes en texte brut (ancien format) vers le nouveau format JSON.
 *
 * Parsing intelligent :
 *  - Ingrédients : 1 ligne = 1 item, strip "- " et "* ", parenthèse d'intro → titre h3
 *  - Préparation : découpe par étapes numérotées (1. / 1- / Étape 1) ou doubles sauts de ligne
 *  - Markdown **gras** → <strong>gras</strong>
 *
 * Usage : node migrate-recipes-to-json.mjs [--dry-run]
 */

import sequelize from './app/database/sequelize-client.js';
import { QueryTypes } from 'sequelize';

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('\n🔍 MODE DRY-RUN — aucune modification en base\n');

/* ── Helpers ─────────────────────────────────────────────────── */

/** Convertit le markdown **gras** et *italique* en HTML */
function mdToHtml(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g,  '<em>$1</em>');
}

/** Nettoie une ligne : retire les puces - / * / • en début */
function cleanLine(line) {
  return line.replace(/^[-*•]\s+/, '').trim();
}

/**
 * Parse les ingrédients en texte brut → tableau JSON.
 * Gère les lignes "(pour 6 personnes)" comme titres de groupe.
 */
function parseIngredients(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Ligne de type "(pour X personnes)" ou "(X pers.)" → titre de groupe h3
    if (/^\(.*\)$/.test(trimmed)) {
      const title = trimmed.slice(1, -1).trim();
      items.push(`<h3 class="rd-ing-group-title">${title}</h3>`);
      continue;
    }

    const cleaned = mdToHtml(cleanLine(trimmed));
    if (cleaned) items.push(cleaned);
  }

  return items;
}

/**
 * Parse la préparation en texte brut → tableau d'étapes JSON.
 * Détecte les patterns :
 *   - "1. ...", "1- ...", "Étape 1 :", "Step 1."
 *   - Sections nommées séparées par \n\n
 *   - Blocs séparés par \n\n si pas d'étapes numérotées
 */
function parsePreparation(raw) {
  const text = raw.replace(/\r\n/g, '\n').trim();

  // Pattern numéroté : "1.", "1-", "2.", etc. en début de ligne
  const numberedPattern = /^(\d+)[.\-\)]\s+/m;

  if (numberedPattern.test(text)) {
    // Découpe aux marqueurs numérotés (lookahead pour conserver le texte)
    const steps = text
      .split(/\n(?=\d+[.\-\)]\s)/);

    return steps
      .map(step => {
        // Retire le numéro en début : "1. " ou "1- "
        const cleaned = step.replace(/^\d+[.\-\)]\s*/, '').trim();
        // Conserve les sous-titres inline (ex: "Les fèves\nPlongez...")
        return mdToHtml(cleaned.replace(/\n/g, '<br>'));
      })
      .filter(Boolean);
  }

  // Pas de numérotation → découpe par double saut de ligne (paragraphes)
  const blocks = text.split(/\n{2,}/);
  if (blocks.length > 1) {
    return blocks
      .map(block => mdToHtml(block.replace(/\n/g, '<br>').trim()))
      .filter(Boolean);
  }

  // Fallback : découpe ligne par ligne (chaque ligne = 1 étape)
  return text
    .split('\n')
    .map(line => mdToHtml(line.trim()))
    .filter(Boolean);
}

/* ── Migration ───────────────────────────────────────────────── */

const recipes = await sequelize.query(
  `SELECT id, name, slug, ingredients, preparation FROM recipes ORDER BY id`,
  { type: QueryTypes.SELECT }
);

console.log(`\n📋 Analyse de ${recipes.length} recette(s)...\n`);
console.log('═'.repeat(70));

let migrated = 0;
let skipped  = 0;

for (const r of recipes) {
  const ingRaw  = (r.ingredients || '').trim();
  const prepRaw = (r.preparation  || '').trim();

  const ingIsJson  = ingRaw.startsWith('[');
  const prepIsJson = prepRaw.startsWith('[');

  if (ingIsJson && prepIsJson) {
    console.log(`\n✅ #${r.id} ${r.name} — déjà en JSON, ignoré`);
    skipped++;
    continue;
  }

  console.log(`\n⚙  #${r.id} ${r.name}`);

  // Parse ingrédients
  let newIng = ingRaw;
  if (!ingIsJson && ingRaw) {
    const parsed = parseIngredients(ingRaw);
    newIng = JSON.stringify(parsed);
    console.log(`   ingrédients : ${parsed.length} items`);
    parsed.slice(0, 3).forEach(i => console.log(`     · ${String(i).slice(0, 80)}`));
    if (parsed.length > 3) console.log(`     … (${parsed.length - 3} de plus)`);
  } else {
    console.log(`   ingrédients : déjà JSON`);
  }

  // Parse préparation
  let newPrep = prepRaw;
  if (!prepIsJson && prepRaw) {
    const parsed = parsePreparation(prepRaw);
    newPrep = JSON.stringify(parsed);
    console.log(`   préparation : ${parsed.length} étape(s)`);
    parsed.slice(0, 2).forEach((s, i) => console.log(`     ${i+1}. ${String(s).replace(/<[^>]+>/g,'').slice(0,80)}`));
    if (parsed.length > 2) console.log(`     … (${parsed.length - 2} de plus)`);
  } else {
    console.log(`   préparation : déjà JSON`);
  }

  if (!DRY_RUN) {
    await sequelize.query(
      'UPDATE recipes SET ingredients = :ing, preparation = :prep WHERE id = :id',
      { replacements: { ing: newIng, prep: newPrep, id: r.id }, type: QueryTypes.UPDATE }
    );
    console.log(`   → ✅ Migré en base`);
  } else {
    console.log(`   → 🔍 (dry-run, non sauvegardé)`);
  }

  migrated++;
}

console.log('\n' + '═'.repeat(70));
console.log(`\n📊 Résultat :`);
console.log(`   Migrés   : ${migrated}`);
console.log(`   Ignorés  : ${skipped}`);
if (!DRY_RUN && migrated > 0) {
  console.log('\n✅ Migration terminée. Vérifie les pages recettes.');
}

await sequelize.close();
