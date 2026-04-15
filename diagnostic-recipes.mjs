/**
 * diagnostic-recipes.mjs
 * Analyse le format de stockage des ingrédients et préparation de toutes les recettes.
 * Identifie les recettes en ancien format texte brut vs nouveau format JSON.
 *
 * Usage : node diagnostic-recipes.mjs
 */

import sequelize from './app/database/sequelize-client.js';
import { QueryTypes } from 'sequelize';

const recipes = await sequelize.query(
  `SELECT id, name, slug, status, ingredients, preparation FROM recipes ORDER BY id`,
  { type: QueryTypes.SELECT }
);

console.log(`\n📋 ${recipes.length} recette(s) trouvée(s)\n`);
console.log('═'.repeat(70));

let needsMigration = 0;
let alreadyJson = 0;
let empty = 0;

for (const r of recipes) {
  const ingRaw  = (r.ingredients || '').trim();
  const prepRaw = (r.preparation || '').trim();

  const ingIsJson  = ingRaw.startsWith('[');
  const prepIsJson = prepRaw.startsWith('[');
  const ingEmpty   = !ingRaw;
  const prepEmpty  = !prepRaw;

  let ingCount  = '—';
  let prepCount = '—';

  if (ingIsJson)  { try { ingCount  = JSON.parse(ingRaw).length  + ' items'; } catch { ingCount  = '⚠ JSON invalide'; } }
  else if (!ingEmpty)  ingCount  = ingRaw.split('\n').filter(Boolean).length  + ' lignes (texte brut)';

  if (prepIsJson) { try { prepCount = JSON.parse(prepRaw).length + ' étapes'; } catch { prepCount = '⚠ JSON invalide'; } }
  else if (!prepEmpty) prepCount = prepRaw.split(/\n{2,}/).filter(Boolean).length + ' blocs (texte brut)';

  const status = !ingIsJson || !prepIsJson ? '⚠  TEXTE BRUT' : '✅ JSON';
  if (!ingIsJson || !prepIsJson) needsMigration++;
  else alreadyJson++;
  if (ingEmpty && prepEmpty) empty++;

  console.log(`\n#${r.id} [${r.status}] ${r.name}`);
  console.log(`   slug        : ${r.slug || '—'}`);
  console.log(`   ingrédients : ${ingIsJson ? '✅ JSON' : ingEmpty ? '— vide' : '⚠  texte brut'} (${ingCount})`);
  console.log(`   préparation : ${prepIsJson ? '✅ JSON' : prepEmpty ? '— vide' : '⚠  texte brut'} (${prepCount})`);
  console.log(`   → ${status}`);

  // Aperçu du contenu texte brut si concerné
  if (!ingIsJson && !ingEmpty) {
    const preview = ingRaw.slice(0, 120).replace(/\n/g, ' ↵ ');
    console.log(`   ing aperçu  : "${preview}${ingRaw.length > 120 ? '…' : ''}"`);
  }
  if (!prepIsJson && !prepEmpty) {
    const preview = prepRaw.slice(0, 120).replace(/\n/g, ' ↵ ');
    console.log(`   prep aperçu : "${preview}${prepRaw.length > 120 ? '…' : ''}"`);
  }
}

console.log('\n' + '═'.repeat(70));
console.log(`\n📊 Résumé :`);
console.log(`   ✅ JSON (OK)          : ${alreadyJson}`);
console.log(`   ⚠  Texte brut (mig.) : ${needsMigration}`);
console.log(`   — Vides              : ${empty}`);

if (needsMigration > 0) {
  console.log(`\n💡 ${needsMigration} recette(s) en texte brut détectée(s).`);
  console.log(`   Lancer : node migrate-recipes-to-json.mjs  pour migrer automatiquement.`);
} else {
  console.log(`\n✅ Toutes les recettes sont déjà au format JSON.`);
}

await sequelize.close();
